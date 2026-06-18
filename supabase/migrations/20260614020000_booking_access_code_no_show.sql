-- Add no_show to booking status enum (partner can mark a guest as did not arrive)
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'no_show';
