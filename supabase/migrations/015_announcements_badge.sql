-- Add last_viewed_announcements column to users table
ALTER TABLE alumni_v2.users ADD COLUMN IF NOT EXISTS last_viewed_announcements TIMESTAMP WITH TIME ZONE DEFAULT NULL;
