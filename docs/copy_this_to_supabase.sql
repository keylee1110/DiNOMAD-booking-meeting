-- COPY AND PASTE THIS ENTIRE FILE INTO THE SUPABASE SQL EDITOR AND RUN IT.
-- This script updates user profiles, bookings, creates wishlists, point transactions,
-- and registers triggers for unique booking codes and loyalty points (with cancel/refund support).

-- =========================================================================
-- 1. CẬP NHẬT THÊM CỘT CHO BẢNG PROFILES VÀ BOOKINGS
-- =========================================================================

-- Thêm cột tích lũy điểm thưởng vào profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

-- Thêm các cột mã đặt phòng, điểm đã tiêu, điểm được cộng, trạng thái thanh toán vào bookings
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS booking_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS points_redeemed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text;

-- Cho phép khách hàng tự cập nhật trạng thái đơn đặt chỗ của chính mình (ví dụ: hoàn thành hoặc hủy)
DROP POLICY IF EXISTS "Users can update own bookings status" ON public.bookings;
CREATE POLICY "Users can update own bookings status"
  ON public.bookings FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- =========================================================================
-- 2. TẠO BẢNG WISHLIST (PHÒNG YÊU THÍCH) VÀ CẤU HÌNH BẢO MẬT RLS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, room_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Xóa chính sách cũ nếu có trước khi tạo lại để tránh trùng lặp
DROP POLICY IF EXISTS "Users can read own wishlist" ON public.wishlists;
CREATE POLICY "Users can read own wishlist"
  ON public.wishlists FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage own wishlist"
  ON public.wishlists FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- 3. TẠO BẢNG LỊCH SỬ GIAO DỊCH ĐIỂM (POINT TRANSACTIONS) VÀ BẢO MẬT RLS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  amount integer NOT NULL, -- số dương là cộng điểm, số âm là trừ điểm
  type text NOT NULL, -- 'earn' | 'redeem' | 'refund' | 'revert'
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS point_transactions_profile_id_idx ON public.point_transactions (profile_id);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.point_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.point_transactions FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- =========================================================================
-- 4. TRIGGER TỰ ĐỘNG TẠO MÃ ĐẶT PHÒNG DUY NHẤT (Ví dụ: DN-X9Y2A5)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.generate_unique_booking_code()
RETURNS trigger AS $$
DECLARE
  new_code text;
  exists_code boolean;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
BEGIN
  IF NEW.booking_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    new_code := 'DN-' || (
      SELECT string_agg(substr(chars, floor(random() * 36)::integer + 1, 1), '')
      FROM generate_series(1, 6)
    );
    
    SELECT exists(SELECT 1 FROM public.bookings WHERE booking_code = new_code) INTO exists_code;
    
    IF NOT exists_code THEN
      NEW.booking_code := new_code;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Xóa trigger cũ trước khi khởi tạo mới (đáp ứng cú pháp Postgres)
DROP TRIGGER IF EXISTS bookings_generate_booking_code ON public.bookings;
CREATE TRIGGER bookings_generate_booking_code
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.generate_unique_booking_code();

-- =========================================================================
-- 5. TRIGGER ĐỒNG BỘ ĐIỂM VÀ TỰ ĐỘNG HOÀN ĐIỂM KHI HỦY PHÒNG (CƠ CHẾ HOÀN/HỦY)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.process_booking_loyalty_points()
RETURNS trigger AS $$
BEGIN
  -- A. Cộng/Trừ điểm khi đặt phòng thành công (CONFIRMED hoặc COMPLETED)
  -- Đối với INSERT: kiểm tra trạng thái là confirmed hoặc completed
  -- Đối với UPDATE: kiểm tra chuyển từ pending sang confirmed hoặc completed
  IF (TG_OP = 'INSERT' AND (NEW.status = 'confirmed' OR NEW.status = 'completed')) OR
     (TG_OP = 'UPDATE' AND (NEW.status = 'confirmed' OR NEW.status = 'completed') AND (OLD.status = 'pending')) THEN
    
    -- Trừ điểm tích lũy đã tiêu dùng (Redeem)
    IF NEW.points_redeemed > 0 AND (TG_OP = 'INSERT' OR OLD.status = 'pending') THEN
      UPDATE public.profiles
      SET points = greatest(0, points - NEW.points_redeemed)
      WHERE id = NEW.customer_id;
      
      INSERT INTO public.point_transactions (profile_id, booking_id, amount, type, description)
      VALUES (NEW.customer_id, NEW.id, -NEW.points_redeemed, 'redeem', 'Redeemed points for booking ' || NEW.booking_code);
    END IF;
    
    -- Cộng điểm thưởng tích lũy (Earn):
    -- Đơn cọc (payment_status = 'deposited') chỉ cộng điểm khi đã hoàn thành (status = 'completed')
    -- Đơn thanh toán đầy đủ cộng ngay khi confirmed hoặc completed
    IF NEW.points_earned > 0 THEN
      IF coalesce(NEW.payment_status, '') != 'deposited' OR NEW.status = 'completed' THEN
        -- Kiểm tra xem đã cộng điểm chưa để tránh trùng lặp
        IF NOT EXISTS (
          SELECT 1 FROM public.point_transactions 
          WHERE booking_id = NEW.id AND type = 'earn'
        ) THEN
          UPDATE public.profiles
          SET points = points + NEW.points_earned
          WHERE id = NEW.customer_id;
          
          INSERT INTO public.point_transactions (profile_id, booking_id, amount, type, description)
          VALUES (NEW.customer_id, NEW.id, NEW.points_earned, 'earn', 'Earned points for booking ' || NEW.booking_code);
        END IF;
      END IF;
    END IF;
  END IF;

  -- B. Khi đơn đặt phòng được cập nhật trạng thái trực tiếp
  -- Nếu chuyển từ confirmed sang completed, và là đơn cọc (payment_status = 'deposited'): cộng điểm thưởng ở đây
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status = 'confirmed' THEN
    IF NEW.payment_status = 'deposited' AND NEW.points_earned > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.point_transactions 
        WHERE booking_id = NEW.id AND type = 'earn'
      ) THEN
        UPDATE public.profiles
        SET points = points + NEW.points_earned
        WHERE id = NEW.customer_id;
        
        INSERT INTO public.point_transactions (profile_id, booking_id, amount, type, description)
        VALUES (NEW.customer_id, NEW.id, NEW.points_earned, 'earn', 'Earned points for booking ' || NEW.booking_code);
      END IF;
    END IF;
  END IF;
  
  -- C. Hoàn lại và thu hồi điểm khi đơn đặt phòng bị HỦY (Chuyển sang CANCELLED)
  -- Chỉ áp dụng khi UPDATE từ trạng thái CONFIRMED hoặc COMPLETED
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND (OLD.status = 'confirmed' OR OLD.status = 'completed') THEN
    -- Hoàn lại điểm tích lũy khách đã dùng để thanh toán (Refund)
    IF OLD.points_redeemed > 0 THEN
      UPDATE public.profiles
      SET points = points + OLD.points_redeemed
      WHERE id = OLD.customer_id;
      
      INSERT INTO public.point_transactions (profile_id, booking_id, amount, type, description)
      VALUES (OLD.customer_id, OLD.id, OLD.points_redeemed, 'refund', 'Refunded points for cancelled booking ' || OLD.booking_code);
    END IF;
    
    -- Thu hồi điểm thưởng đã cộng trước đó (Revert) - chỉ thu hồi nếu ĐÃ thực tế cộng điểm
    IF OLD.points_earned > 0 AND EXISTS (
      SELECT 1 FROM public.point_transactions 
      WHERE booking_id = OLD.id AND type = 'earn'
    ) THEN
      UPDATE public.profiles
      SET points = greatest(0, points - OLD.points_earned)
      WHERE id = OLD.customer_id;
      
      INSERT INTO public.point_transactions (profile_id, booking_id, amount, type, description)
      VALUES (OLD.customer_id, OLD.id, -OLD.points_earned, 'revert', 'Reverted earned points for cancelled booking ' || OLD.booking_code);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_loyalty_points_trigger ON public.bookings;
CREATE TRIGGER bookings_loyalty_points_trigger
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.process_booking_loyalty_points();

-- =========================================================================
-- 6. RPC: increment_user_points (Atomic points update — frontend fallback)
-- =========================================================================
-- Được gọi từ frontend sau khi thanh toán thành công.
-- Trigger (process_booking_loyalty_points) xử lý chính, đây là phương án dự phòng.
CREATE OR REPLACE FUNCTION public.increment_user_points(
  user_id  uuid,
  delta    integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  -- Chỉ cho phép user tự thay đổi điểm của chính mình
  IF user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: cannot modify another user''s points.';
  END IF;

  UPDATE public.profiles
  SET points = GREATEST(0, points + delta)
  WHERE id = user_id
  RETURNING points INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
  END IF;

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_user_points(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_points(uuid, integer) TO authenticated;

-- =========================================================================
-- 7. VIEW: user_booking_summary (Thống kê đặt phòng cho trang Profile)
-- =========================================================================
CREATE OR REPLACE VIEW public.user_booking_summary AS
SELECT
  b.customer_id                                          AS user_id,
  COUNT(*)                                               AS total_bookings,
  COUNT(*) FILTER (WHERE b.status = 'completed')        AS completed_bookings,
  COUNT(*) FILTER (WHERE b.status = 'cancelled')        AS cancelled_bookings,
  COALESCE(SUM(b.total_amount), 0)                      AS total_spent,
  COALESCE(SUM(b.points_earned), 0)                     AS total_points_earned,
  COALESCE(SUM(b.points_redeemed), 0)                   AS total_points_redeemed
FROM public.bookings b
GROUP BY b.customer_id;

ALTER VIEW public.user_booking_summary SET (security_invoker = true);
GRANT SELECT ON public.user_booking_summary TO authenticated;
