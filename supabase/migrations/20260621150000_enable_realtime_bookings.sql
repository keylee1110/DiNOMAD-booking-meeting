-- Enable Supabase Realtime for public.bookings table to allow frontend subscription
alter publication supabase_realtime add table public.bookings;
