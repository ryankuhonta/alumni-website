-- Grant access on job_likes to authenticated users (RLS policies already exist)
GRANT SELECT, INSERT, DELETE ON alumni_v2.job_likes TO authenticated;
