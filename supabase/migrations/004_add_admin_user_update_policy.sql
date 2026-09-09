-- Add admin policy to update any user (for reject/ban functionality)
-- This does NOT cause infinite recursion because it only reads role, not status

CREATE POLICY "Admins can update any user"
  ON alumni_v2.users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
