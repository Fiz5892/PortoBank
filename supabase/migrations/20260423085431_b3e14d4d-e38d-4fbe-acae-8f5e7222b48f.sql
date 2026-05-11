
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Public can read individual files (by path) but cannot list the bucket
CREATE POLICY "Public can read individual avatar files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);
