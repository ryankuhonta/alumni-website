-- Allow anon to read org info (for public pages like About, Homepage)
DROP POLICY IF EXISTS "Anyone can view org info" ON alumni_v2.organization_info;
CREATE POLICY "Anyone can view org info"
  ON alumni_v2.organization_info FOR SELECT
  USING (true);

-- Allow anon to read officers (for public About page)
DROP POLICY IF EXISTS "Anyone can view officers" ON alumni_v2.officers;
CREATE POLICY "Anyone can view officers"
  ON alumni_v2.officers FOR SELECT
  USING (true);

-- Allow anon to read approved users (for public Directory)
DROP POLICY IF EXISTS "Users can view approved users" ON alumni_v2.users;
CREATE POLICY "Users can view approved users"
  ON alumni_v2.users FOR SELECT
  USING (status = 'approved' OR id = auth.uid());

-- Allow anon to read events
DROP POLICY IF EXISTS "Authenticated can view events" ON alumni_v2.events;
CREATE POLICY "Anyone can view events"
  ON alumni_v2.events FOR SELECT
  USING (true);

-- Allow anon to read announcements
DROP POLICY IF EXISTS "Authenticated can view announcements" ON alumni_v2.announcements;
CREATE POLICY "Anyone can view announcements"
  ON alumni_v2.announcements FOR SELECT
  USING (true);

-- Allow anon to read active jobs
DROP POLICY IF EXISTS "Authenticated can view active jobs" ON alumni_v2.jobs;
CREATE POLICY "Anyone can view active jobs"
  ON alumni_v2.jobs FOR SELECT
  USING (status = 'active');
