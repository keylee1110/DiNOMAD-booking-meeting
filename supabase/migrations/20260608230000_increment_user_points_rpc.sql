-- =========================================================================
-- Migration: increment_user_points RPC (Safe Atomic Points Update)
-- Created: 2026-06-08
-- Purpose: Provide a safe, atomic RPC for the frontend to adjust a user's
--          points balance. Used as a fallback alongside the booking trigger.
--          The trigger (process_booking_loyalty_points) handles the primary
--          flow; this RPC is a safety net when trigger-based flow is bypassed.
-- =========================================================================

-- RPC: increment_user_points
-- Atomically adjusts a user's point balance by `delta` (positive or negative).
-- Returns the new points balance.
-- Security: SECURITY DEFINER runs as the function owner (bypasses RLS).
-- Only authenticated users can call this (enforced by GRANT below).
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
  -- Prevent calling for another user (frontend must pass auth.uid())
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

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.increment_user_points(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_points(uuid, integer) TO authenticated;

-- =========================================================================
-- Helper view: user_points_summary (optional — for profile dashboard)
-- Returns total bookings, completed bookings, and total spend for a user.
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

-- Enable RLS-style access via security barrier
ALTER VIEW public.user_booking_summary SET (security_invoker = true);

-- Allow authenticated users to select only their own row
GRANT SELECT ON public.user_booking_summary TO authenticated;
