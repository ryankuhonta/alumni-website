-- Revert users SELECT to authenticated only (directory is for logged-in users only)
DROP POLICY IF EXISTS "Users can view approved users" ON alumni_v2.users;
CREATE POLICY "Users can view approved users"
  ON alumni_v2.users FOR SELECT
  TO authenticated
  USING (status = 'approved' OR id = auth.uid());
