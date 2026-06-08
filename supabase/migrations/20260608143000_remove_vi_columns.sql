-- 1. Remove _vi columns from public.venues
alter table public.venues drop column if exists name_vi;
alter table public.venues drop column if exists description_vi;
alter table public.venues drop column if exists address_vi;

-- 2. Remove _vi columns from public.rooms
alter table public.rooms drop column if exists name_vi;
alter table public.rooms drop column if exists description_vi;
alter table public.rooms drop column if exists specs_vi;

-- 3. Remove _vi columns from public.reviews
alter table public.reviews drop column if exists comment_vi;
