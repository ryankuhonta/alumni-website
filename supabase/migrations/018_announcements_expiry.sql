-- Add expires_at column to announcements (null = never expires)
ALTER TABLE alumni_v2.announcements
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL;
