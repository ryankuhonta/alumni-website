-- 008_social_media_links.sql
-- Add social media URL and visibility columns to organization_info

ALTER TABLE alumni_v2.organization_info
ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS show_facebook boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_instagram boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_linkedin boolean DEFAULT false;
