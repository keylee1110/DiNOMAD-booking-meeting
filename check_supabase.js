const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cofqjiooujbmihhclwso.supabase.co', 'sb_publishable_NlYR4kpM-QcgsPXhtCkb-A_vBTANzrn');

const PUBLIC_ROOM_SELECT = `
  id, venue_id, name, description, capacity, price_per_hour,
  category, verified, noise_level, specs,
  venues!inner(name, address, district, lat, lng, status),
  room_amenities(amenity),
  room_vibe_tags(vibe_tag),
  room_images(image_url, sort_order)
`;

async function check() {
  const { data, error } = await supabase
    .from("rooms")
    .select(PUBLIC_ROOM_SELECT)
    .eq("status", "published")
    .eq("venues.status", "published")
    .order("created_at", { ascending: false });
  console.log("Public Rooms Query Results:", data, error);
}
check();
