-- 1. Delete existing auth user
DELETE FROM auth.users WHERE email = 'rkuhonta@gmail.com';

-- 2. Drop ALL existing policies on users table (fixes infinite recursion)
DROP POLICY IF EXISTS "Users can view approved users" ON alumni_v2.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON alumni_v2.users;
DROP POLICY IF EXISTS "Users can update own profile" ON alumni_v2.users;
DROP POLICY IF EXISTS "Admins can do everything on users" ON alumni_v2.users;

-- 3. Recreate policies WITHOUT self-referencing
CREATE POLICY "Users can view approved users"
  ON alumni_v2.users FOR SELECT
  TO authenticated
  USING (status = 'approved' OR id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON alumni_v2.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON alumni_v2.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());
