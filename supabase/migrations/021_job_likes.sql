-- Likes for Alumni Network posts (1 like per user per post)
CREATE TABLE IF NOT EXISTS alumni_v2.job_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES alumni_v2.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES alumni_v2.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (job_id, user_id)
);

ALTER TABLE alumni_v2.job_likes ENABLE ROW LEVEL SECURITY;

-- Logged-in users can view all likes (counts are public within the network)
CREATE POLICY "Authenticated can view job likes"
  ON alumni_v2.job_likes FOR SELECT
  TO authenticated
  USING (true);

-- Users can like (only as themselves)
CREATE POLICY "Users can like posts"
  ON alumni_v2.job_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can unlike their own likes
CREATE POLICY "Users can unlike own likes"
  ON alumni_v2.job_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
