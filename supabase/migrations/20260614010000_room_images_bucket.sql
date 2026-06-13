-- Create the room-images storage bucket (public, 5 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('room-images', 'room-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Public read (room images are visible to all guests browsing listings)
DO $$ BEGIN
  CREATE POLICY "room_images_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'room-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop old permissive write policies before recreating with path scoping
DROP POLICY IF EXISTS "room_images_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "room_images_auth_delete" ON storage.objects;

-- Upload path must be: rooms/{userId}/{roomId}/{filename}
-- (storage.foldername returns everything except the filename, 1-indexed array)
-- [1] = 'rooms', [2] = userId, [3] = roomId
-- Enforcing [2] = auth.uid() means a user can only write under their own prefix.
CREATE POLICY "room_images_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'room-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "room_images_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'room-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
