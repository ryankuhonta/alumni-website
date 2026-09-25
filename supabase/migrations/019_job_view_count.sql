-- Add view_count column to jobs (Alumni Network)
ALTER TABLE alumni_v2.jobs
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Atomic increment function (avoids race conditions on concurrent views)
CREATE OR REPLACE FUNCTION alumni_v2.increment_job_views(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE alumni_v2.jobs
  SET view_count = view_count + 1
  WHERE id = job_id;
END;
$$;
