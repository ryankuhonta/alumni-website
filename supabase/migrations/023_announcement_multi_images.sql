-- Migration 023: Multi-image support for announcements + configurable limit

-- 1. Add images array to announcements (backfill from existing cover_image)
ALTER TABLE alumni_v2.announcements
ADD COLUMN IF NOT EXISTS images text[];

UPDATE alumni_v2.announcements
SET images = ARRAY[cover_image]
WHERE cover_image IS NOT NULL AND images IS NULL;

-- 2. Add configurable max images per announcement (1-5)
ALTER TABLE alumni_v2.organization_info
ADD COLUMN IF NOT EXISTS max_announcement_images integer NOT NULL DEFAULT 1;

-- Clamp to valid range
UPDATE alumni_v2.organization_info
SET max_announcement_images = LEAST(GREATEST(max_announcement_images, 1), 5);
