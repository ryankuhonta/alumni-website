-- 010_add_opportunity_types.sql
-- Add service and product types to jobs table

-- Drop existing check constraint and add new one
ALTER TABLE alumni_v2.jobs
DROP CONSTRAINT IF EXISTS jobs_job_type_check;

ALTER TABLE alumni_v2.jobs
ADD CONSTRAINT jobs_job_type_check CHECK (job_type IN ('full_time', 'part_time', 'contract', 'freelance', 'service', 'product'));
