-- Create events storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to events bucket
CREATE POLICY "Authenticated can upload events"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'events');

-- Allow anyone to view events images (public bucket)
CREATE POLICY "Anyone can view events images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'events');

-- Allow admins/moderators to delete events images
CREATE POLICY "Admins can delete events images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'events'
    AND EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );
