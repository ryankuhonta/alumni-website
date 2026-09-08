-- Create custom schema
CREATE SCHEMA IF NOT EXISTS alumni_v2;

-- Set search path to use the new schema
SET search_path TO alumni_v2;

-- Users table (extends auth.users)
create table alumni_v2.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text not null,
  batch_year integer not null,
  course text,
  current_company text,
  location text,
  profile_picture text,
  role text not null default 'alumni' check (role in ('admin', 'alumni')),
  status text not null default 'approved' check (status in ('approved', 'pending', 'rejected', 'banned')),
  privacy_company boolean not null default false,
  privacy_location boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events table
create table alumni_v2.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  event_date date not null,
  event_time time,
  venue text,
  map_url text,
  cover_image text,
  created_by uuid not null references alumni_v2.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Event RSVPs
create table alumni_v2.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references alumni_v2.events(id) on delete cascade,
  user_id uuid not null references alumni_v2.users(id) on delete cascade,
  status text not null check (status in ('going', 'maybe', 'not_going')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

-- Event Photos
create table alumni_v2.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references alumni_v2.events(id) on delete cascade,
  photo_url text not null,
  caption text,
  uploaded_by uuid not null references alumni_v2.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Announcements
create table alumni_v2.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  cover_image text,
  is_pinned boolean not null default false,
  created_by uuid not null references alumni_v2.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jobs
create table alumni_v2.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text,
  description text not null,
  requirements text,
  application_link text,
  application_email text,
  job_type text not null default 'full_time' check (job_type in ('full_time', 'part_time', 'contract', 'freelance')),
  posted_by uuid not null references alumni_v2.users(id),
  status text not null default 'active' check (status in ('active', 'closed', 'removed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Officers
create table alumni_v2.officers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references alumni_v2.users(id),
  position text not null,
  name text not null,
  photo_url text,
  display_order integer not null default 0,
  term_year text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organization Info (single row)
create table alumni_v2.organization_info (
  id uuid primary key default gen_random_uuid(),
  mission text not null,
  vision text not null,
  about text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table alumni_v2.users enable row level security;
alter table alumni_v2.events enable row level security;
alter table alumni_v2.event_rsvps enable row level security;
alter table alumni_v2.event_photos enable row level security;
alter table alumni_v2.announcements enable row level security;
alter table alumni_v2.jobs enable row level security;
alter table alumni_v2.officers enable row level security;
alter table alumni_v2.organization_info enable row level security;

-- RLS Policies

-- Users: readable by authenticated, writable by self
-- NOTE: No self-referencing admin policy (causes infinite recursion)
create policy "Users can view approved users"
  on alumni_v2.users for select
  to authenticated
  using (status = 'approved' or id = auth.uid());

create policy "Users can insert own profile"
  on alumni_v2.users for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update own profile"
  on alumni_v2.users for update
  to authenticated
  using (id = auth.uid());

-- Events: readable by authenticated, writable by admin
create policy "Authenticated can view events"
  on alumni_v2.events for select
  to authenticated
  using (true);

create policy "Admins can manage events"
  on alumni_v2.events for all
  to authenticated
  using (
    exists (
      select 1 from alumni_v2.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Event RSVPs: readable/writable by authenticated
create policy "Authenticated can view RSVPs"
  on alumni_v2.event_rsvps for select
  to authenticated
  using (true);

create policy "Users can manage own RSVPs"
  on alumni_v2.event_rsvps for all
  to authenticated
  using (user_id = auth.uid());

-- Event Photos: readable by authenticated, writable by admin
create policy "Authenticated can view photos"
  on alumni_v2.event_photos for select
  to authenticated
  using (true);

create policy "Admins can manage photos"
  on alumni_v2.event_photos for all
  to authenticated
  using (
    exists (
      select 1 from alumni_v2.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Announcements: readable by authenticated, writable by admin
create policy "Authenticated can view announcements"
  on alumni_v2.announcements for select
  to authenticated
  using (true);

create policy "Admins can manage announcements"
  on alumni_v2.announcements for all
  to authenticated
  using (
    exists (
      select 1 from alumni_v2.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Jobs: readable by authenticated, writable by authenticated (own jobs)
create policy "Authenticated can view active jobs"
  on alumni_v2.jobs for select
  to authenticated
  using (status = 'active');

create policy "Users can manage own jobs"
  on alumni_v2.jobs for all
  to authenticated
  using (posted_by = auth.uid());

create policy "Admins can manage all jobs"
  on alumni_v2.jobs for all
  to authenticated
  using (
    exists (
      select 1 from alumni_v2.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Officers: readable by all, writable by admin
create policy "Anyone can view officers"
  on alumni_v2.officers for select
  to authenticated
  using (true);

create policy "Admins can manage officers"
  on alumni_v2.officers for all
  to authenticated
  using (
    exists (
      select 1 from alumni_v2.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Organization Info: readable by all, writable by admin
create policy "Anyone can view org info"
  on alumni_v2.organization_info for select
  to authenticated
  using (true);

create policy "Admins can manage org info"
  on alumni_v2.organization_info for all
  to authenticated
  using (
    exists (
      select 1 from alumni_v2.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Grant usage to authenticated and anon roles
GRANT USAGE ON SCHEMA alumni_v2 TO authenticated;
GRANT USAGE ON SCHEMA alumni_v2 TO anon;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA alumni_v2 TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA alumni_v2 TO anon;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA alumni_v2 TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA alumni_v2 TO anon;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA alumni_v2 TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA alumni_v2 TO anon;
