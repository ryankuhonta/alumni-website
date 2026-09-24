-- Create announcements storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to announcements bucket
CREATE POLICY "Authenticated can upload announcements"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcements');

-- Allow anyone to view announcements images (public bucket)
CREATE POLICY "Anyone can view announcements images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'announcements');

-- Allow admins/moderators to delete announcements images
CREATE POLICY "Admins can delete announcements images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'announcements'
    AND EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );
