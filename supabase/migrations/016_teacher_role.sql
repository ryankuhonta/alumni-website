-- Add subject column for teachers
ALTER TABLE alumni_v2.users ADD COLUMN IF NOT EXISTS subject TEXT;

-- Update role CHECK constraint to include 'teacher'
ALTER TABLE alumni_v2.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE alumni_v2.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'moderator', 'alumni', 'teacher'));
