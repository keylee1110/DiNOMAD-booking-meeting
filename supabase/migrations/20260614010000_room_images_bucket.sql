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

-- Authenticated partners can upload
DO $$ BEGIN
  CREATE POLICY "room_images_auth_upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'room-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can delete (ownership enforced at DB row level, not storage)
DO $$ BEGIN
  CREATE POLICY "room_images_auth_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'room-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
