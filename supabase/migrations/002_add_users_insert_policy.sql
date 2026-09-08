-- Fix: Add INSERT policy for users table
-- This policy allows authenticated users to create their own profile during registration

create policy "Users can insert own profile"
  on alumni_v2.users for insert
  to authenticated
  with check (id = auth.uid());
