-- 009_add_profile_fields.sql
-- Add new profile fields to users table

ALTER TABLE alumni_v2.users
ADD COLUMN IF NOT EXISTS mobile_number text DEFAULT '',
ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS job_title text DEFAULT '',
ADD COLUMN IF NOT EXISTS birthday date DEFAULT NULL;
