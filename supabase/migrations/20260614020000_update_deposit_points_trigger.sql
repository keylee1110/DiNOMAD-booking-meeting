-- Migration: update_deposit_points_trigger
-- Created: 2026-06-14
-- Purpose: Modify process_booking_loyalty_points trigger so that deposit bookings
--          (payment_status = 'deposited') only earn loyalty points when they check in
--          (status = 'checked_in' or 'completed'), rather than waiting until 'completed'.

create or replace function public.process_booking_loyalty_points()
returns trigger as $$
begin
  -- A. Cộng/Trừ điểm khi đặt phòng thành công hoặc khi check-in
  -- Đối với INSERT: kiểm tra trạng thái là confirmed hoặc completed hoặc checked_in
  -- Đối với UPDATE: kiểm tra chuyển sang confirmed hoặc completed hoặc checked_in
  if (TG_OP = 'INSERT' and (NEW.status = 'confirmed' or NEW.status = 'completed' or NEW.status = 'checked_in')) or
     (TG_OP = 'UPDATE' and (NEW.status = 'confirmed' or NEW.status = 'completed' or NEW.status = 'checked_in') and (OLD.status = 'pending' or OLD.status = 'confirmed')) then
    
    -- Trừ điểm tích lũy đã tiêu dùng (Redeem)
    if NEW.points_redeemed > 0 and (TG_OP = 'INSERT' or OLD.status = 'pending') then
      update public.profiles
      set points = greatest(0, points - NEW.points_redeemed)
      where id = NEW.customer_id;
      
      insert into public.point_transactions (profile_id, booking_id, amount, type, description)
      values (NEW.customer_id, NEW.id, -NEW.points_redeemed, 'redeem', 'Redeemed points for booking ' || NEW.booking_code);
    end if;
    
    -- Cộng điểm thưởng tích lũy (Earn):
    -- Đơn cọc (payment_status = 'deposited') chỉ cộng điểm khi đã đến quán check in (status = 'checked_in' hoặc 'completed')
    -- Đơn thanh toán đầy đủ cộng ngay khi confirmed hoặc completed hoặc checked_in
    if NEW.points_earned > 0 then
      if (coalesce(NEW.payment_status, '') != 'deposited' and (NEW.status = 'confirmed' or NEW.status = 'checked_in' or NEW.status = 'completed')) or
         (coalesce(NEW.payment_status, '') = 'deposited' and (NEW.status = 'checked_in' or NEW.status = 'completed')) then
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
  -- Nếu chuyển từ confirmed sang checked_in, và là đơn cọc (payment_status = 'deposited'): cộng điểm thưởng ở đây
  if TG_OP = 'UPDATE' and NEW.status = 'checked_in' and OLD.status = 'confirmed' then
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
  -- Chỉ áp dụng khi UPDATE từ trạng thái CONFIRMED hoặc COMPLETED hoặc CHECKED_IN
  if TG_OP = 'UPDATE' and NEW.status = 'cancelled' and (OLD.status = 'confirmed' or OLD.status = 'completed' or OLD.status = 'checked_in') then
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
$$ language plpgsql security definer;
