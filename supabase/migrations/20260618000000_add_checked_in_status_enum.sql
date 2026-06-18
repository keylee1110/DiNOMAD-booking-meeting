-- Migration: add_checked_in_status_enum
-- Created: 2026-06-18
-- Purpose: Add 'checked_in' value to booking_status enum type to support real-time guest check-in tracking.

ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'checked_in';
