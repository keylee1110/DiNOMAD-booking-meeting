-- Migration to add loyalty points, booking code, wishlists, and point transactions tables to support DiNOMAD backlog tasks.

-- 1. Add loyalty points to profiles
alter table public.profiles 
  add column if not exists points integer not null default 0;

-- 2. Add booking code and points fields to bookings
alter table public.bookings 
  add column if not exists booking_code text unique,
  add column if not exists points_redeemed integer not null default 0,
  add column if not exists points_earned integer not null default 0,
  add column if not exists payment_status text;

-- Add UPDATE policy to bookings so customers can mark their bookings as completed
create policy "Users can update own bookings status"
  on public.bookings for update
  to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- 3. Create Wishlists (Favorite Rooms) Table
create table if not exists public.wishlists (
  user_id uuid not null references public.profiles (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, room_id)
);

alter table public.wishlists enable row level security;

create policy "Users can read own wishlist"
  on public.wishlists for select to authenticated
  using (user_id = auth.uid());

create policy "Users can manage own wishlist"
  on public.wishlists for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4. Create Point Transactions Table
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  amount integer not null, -- positive for earn, negative for redeem
  type text not null, -- 'earn' | 'redeem' | 'refund' | 'revert'
  description text,
  created_at timestamptz not null default now()
);

alter table public.point_transactions enable row level security;

create policy "Users can view own transactions"
  on public.point_transactions for select to authenticated
  using (profile_id = auth.uid());

-- 5. DB Trigger for Unique Booking Code (using floor for uniform distribution)
create or replace function public.generate_unique_booking_code()
returns trigger as $$
declare
  new_code text;
  exists_code boolean;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
begin
  if NEW.booking_code is not null then
    return NEW;
  end if;

  loop
    new_code := 'DN-' || (
      select string_agg(substr(chars, floor(random() * 36)::integer + 1, 1), '')
      from generate_series(1, 6)
    );
    
    select exists(select 1 from public.bookings where booking_code = new_code) into exists_code;
    
    if not exists_code then
      NEW.booking_code := new_code;
      exit;
    end if;
  end loop;
  
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists bookings_generate_booking_code on public.bookings;
create trigger bookings_generate_booking_code
before insert on public.bookings
for each row
execute function public.generate_unique_booking_code();

-- 6. DB Trigger for Points Sync and Cancellation Refunds (runs on AFTER INSERT OR UPDATE)
create or replace function public.process_booking_loyalty_points()
returns trigger as $$
begin
  -- A. Cộng/Trừ điểm khi đặt phòng thành công (CONFIRMED hoặc COMPLETED)
  -- Đối với INSERT: kiểm tra trạng thái là confirmed hoặc completed
  -- Đối với UPDATE: kiểm tra chuyển từ pending sang confirmed hoặc completed
  if (TG_OP = 'INSERT' and (NEW.status = 'confirmed' or NEW.status = 'completed')) or
     (TG_OP = 'UPDATE' and (NEW.status = 'confirmed' or NEW.status = 'completed') and (OLD.status = 'pending')) then
    
    -- Trừ điểm tích lũy đã tiêu dùng (Redeem)
    if NEW.points_redeemed > 0 and (TG_OP = 'INSERT' or OLD.status = 'pending') then
      update public.profiles
      set points = greatest(0, points - NEW.points_redeemed)
      where id = NEW.customer_id;
      
      insert into public.point_transactions (profile_id, booking_id, amount, type, description)
      values (NEW.customer_id, NEW.id, -NEW.points_redeemed, 'redeem', 'Redeemed points for booking ' || NEW.booking_code);
    end if;
    
    -- Cộng điểm thưởng tích lũy (Earn):
    -- Đơn cọc (payment_status = 'deposited') chỉ cộng điểm khi đã hoàn thành (status = 'completed')
    -- Đơn thanh toán đầy đủ cộng ngay khi confirmed hoặc completed
    if NEW.points_earned > 0 then
      if coalesce(NEW.payment_status, '') != 'deposited' or NEW.status = 'completed' then
        -- Kiểm tra xem đã cộng điểm chưa để tránh trùng lặp
        if not exists (
          select 1 from public.point_transactions 
          where booking_id = NEW.id and type = 'earn'
        ) then
          update public.profiles
          set points = points + NEW.points_earned
          where id = NEW.customer_id;
          
          insert into public.point_transactions (profile_id, booking_id, amount, type, description)
          values (NEW.customer_id, NEW.id, NEW.points_earned, 'earn', 'Earned points for booking ' || NEW.booking_code);
        end if;
      end if;
    end if;
  end if;

  -- B. Khi đơn đặt phòng được cập nhật trạng thái trực tiếp
  -- Nếu chuyển từ confirmed sang completed, và là đơn cọc (payment_status = 'deposited'): cộng điểm thưởng ở đây
  if TG_OP = 'UPDATE' and NEW.status = 'completed' and OLD.status = 'confirmed' then
    if NEW.payment_status = 'deposited' and NEW.points_earned > 0 then
      if not exists (
        select 1 from public.point_transactions 
        where booking_id = NEW.id and type = 'earn'
      ) then
        update public.profiles
        set points = points + NEW.points_earned
        where id = NEW.customer_id;
        
        insert into public.point_transactions (profile_id, booking_id, amount, type, description)
        values (NEW.customer_id, NEW.id, NEW.points_earned, 'earn', 'Earned points for booking ' || NEW.booking_code);
      end if;
    end if;
  end if;
  
  -- C. Hoàn lại và thu hồi điểm khi đơn đặt phòng bị HỦY (Chuyển sang CANCELLED)
  -- Chỉ áp dụng khi UPDATE từ trạng thái CONFIRMED hoặc COMPLETED
  if TG_OP = 'UPDATE' and NEW.status = 'cancelled' and (OLD.status = 'confirmed' or OLD.status = 'completed') then
    -- Hoàn lại điểm tích lũy khách đã dùng để thanh toán (Refund)
    if OLD.points_redeemed > 0 then
      update public.profiles
      set points = points + OLD.points_redeemed
      where id = OLD.customer_id;
      
      insert into public.point_transactions (profile_id, booking_id, amount, type, description)
      values (OLD.customer_id, OLD.id, OLD.points_redeemed, 'refund', 'Refunded points for cancelled booking ' || OLD.booking_code);
    end if;
    
    -- Thu hồi điểm thưởng đã cộng trước đó (Revert) - chỉ thu hồi nếu ĐÃ thực tế cộng điểm
    if OLD.points_earned > 0 and exists (
      select 1 from public.point_transactions 
      where booking_id = OLD.id and type = 'earn'
    ) then
      update public.profiles
      set points = greatest(0, points - OLD.points_earned)
      where id = OLD.customer_id;
      
      insert into public.point_transactions (profile_id, booking_id, amount, type, description)
      values (OLD.customer_id, OLD.id, -OLD.points_earned, 'revert', 'Reverted earned points for cancelled booking ' || OLD.booking_code);
    end if;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists bookings_loyalty_points_trigger on public.bookings;
create trigger bookings_loyalty_points_trigger
after insert or update on public.bookings
for each row
execute function public.process_booking_loyalty_points();
