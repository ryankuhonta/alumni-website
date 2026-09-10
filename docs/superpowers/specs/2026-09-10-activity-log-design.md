# Activity Log System Design

> **Status:** Approved by user
> **Date:** 2026-09-10

## Overview

An audit trail system that logs all admin actions with detailed before/after information. Includes a dedicated admin page to view, filter, and manage logs.

## Goals

- Track who did what, when, and what changed
- Provide accountability for admin actions
- Allow configurable log retention with manual cleanup

## Database Schema

### New Table: `alumni_v2.activity_logs`

```sql
CREATE TABLE alumni_v2.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES alumni_v2.users(id),
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  target_name text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_logs_created_at ON alumni_v2.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON alumni_v2.activity_logs(action);
CREATE INDEX idx_activity_logs_admin_id ON alumni_v2.activity_logs(admin_id);
```

### New Column: `alumni_v2.organization_info`

```sql
ALTER TABLE alumni_v2.organization_info
ADD COLUMN log_retention_years integer DEFAULT 0;
```

## RLS Policies

```sql
-- Only admins can view activity logs
CREATE POLICY "Admins can view activity logs"
  ON alumni_v2.activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert activity logs
CREATE POLICY "Admins can insert activity logs"
  ON alumni_v2.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete activity logs (for cleanup)
CREATE POLICY "Admins can delete activity logs"
  ON alumni_v2.activity_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Actions to Log

| Page | Action | Target Type | Details |
|------|--------|-------------|---------|
| Users | `user.approve` | `user` | `{ before: { status }, after: { status } }` |
| Users | `user.reject` | `user` | `{ before: { status }, after: { status } }` |
| Users | `user.ban` | `user` | `{ before: { status }, after: { status } }` |
| Events | `event.create` | `event` | `{ after: { title, event_date } }` |
| Events | `event.update` | `event` | `{ before: {...}, after: {...} }` |
| Events | `event.delete` | `event` | `{ before: { title } }` |
| Officers | `officer.create` | `officer` | `{ after: { name, position } }` |
| Officers | `officer.update` | `officer` | `{ before: {...}, after: {...} }` |
| Officers | `officer.delete` | `officer` | `{ before: { name, position } }` |
| Announcements | `announcement.create` | `announcement` | `{ after: { title } }` |
| Announcements | `announcement.update` | `announcement` | `{ before: {...}, after: {...} }` |
| Announcements | `announcement.delete` | `announcement` | `{ before: { title } }` |
| Settings | `settings.update` | `settings` | `{ before: {...}, after: {...} }` |

## API: `logActivity()` Function

```typescript
// lib/activity-log.ts

interface LogActivityParams {
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details?: { before?: Record<string, any>; after?: Record<string, any> };
}

async function logActivity(params: LogActivityParams): Promise<void>
```

## Admin UI

### New Page: `/admin/activity`

- **Table columns:** Date, Admin Email, Action, Target, Details
- **Filter:** by action type (dropdown)
- **Pagination:** 20 items per page
- **Details expand:** Click row to see before/after JSON

### Settings Addition

- **Log Retention:** Number input (years, 0 = forever)
- **Manual Cleanup Button:** "Clear Logs Older Than [X] Years"

## File Changes

| File | Action |
|------|--------|
| `supabase/migrations/007_activity_logs.sql` | Create table + RLS + index |
| `lib/activity-log.ts` | Create utility function |
| `app/admin/activity/page.tsx` | Create activity log page |
| `components/admin/ActivityLogTable.tsx` | Create table component |
| `components/admin/SettingsForm.tsx` | Add log retention config |
| `components/admin/UserTable.tsx` | Add log calls for approve/reject/ban |
| `components/admin/EventForm.tsx` | Add log calls for create/update |
| `components/admin/OfficerForm.tsx` | Add log calls for create/update/delete |
| `components/admin/AnnouncementForm.tsx` | Add log calls for create/update |
| `components/admin/AnnouncementList.tsx` | Add log calls for delete |
| `components/layout/AdminSidebar.tsx` | Add Activity Log link |
