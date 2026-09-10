# Activity Log System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an audit trail system that logs all admin actions with before/after details, includes a dedicated admin page to view logs, and supports configurable retention.

**Architecture:** 
- New `activity_logs` table in `alumni_v2` schema
- `logActivity()` utility function for consistent logging
- Admin page with table, filtering, and pagination
- Logging integrated into existing admin components

**Tech Stack:** Next.js 16.3.4, Supabase (PostgreSQL), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-09-10-activity-log-design.md`

## Global Constraints

- Schema: `alumni_v2` (all queries must use this schema)
- Auth: Supabase Auth with `alumni_v2.users` table
- UI: Tailwind CSS, blue-800 primary color via CSS variable
- All admin pages require `role = 'admin'`
- Logging must not block user operations (fire-and-forget pattern)

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/007_activity_logs.sql`

**Interfaces:**
- Produces: `alumni_v2.activity_logs` table with indexes and RLS policies

- [ ] **Step 1: Create migration file**

```sql
-- 007_activity_logs.sql
-- Activity Log system for admin action tracking

-- Create activity_logs table
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

-- Create indexes for performance
CREATE INDEX idx_activity_logs_created_at ON alumni_v2.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON alumni_v2.activity_logs(action);
CREATE INDEX idx_activity_logs_admin_id ON alumni_v2.activity_logs(admin_id);

-- Enable RLS
ALTER TABLE alumni_v2.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view activity logs"
  ON alumni_v2.activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert activity logs
CREATE POLICY "Admins can insert activity logs"
  ON alumni_v2.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete activity logs (for cleanup)
CREATE POLICY "Admins can delete activity logs"
  ON alumni_v2.activity_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add log_retention_years to organization_info
ALTER TABLE alumni_v2.organization_info
ADD COLUMN IF NOT EXISTS log_retention_years integer DEFAULT 0;
```

- [ ] **Step 2: Run migration on Supabase**

Run the SQL in Supabase Dashboard > SQL Editor

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/007_activity_logs.sql
git commit -m "feat: add activity_logs table and RLS policies"
```

---

## Task 2: Activity Log Utility Function

**Files:**
- Create: `lib/activity-log.ts`

**Interfaces:**
- Consumes: Supabase browser client
- Produces: `logActivity()` function

- [ ] **Step 1: Create utility function**

```typescript
// lib/activity-log.ts
import { createClient } from '@/lib/supabase/client'

interface LogActivityParams {
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) return

  const { error } = await supabase.from('activity_logs').insert({
    admin_id: user.id,
    admin_email: user.email || 'unknown',
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId || null,
    target_name: params.targetName || null,
    details: params.details || null,
  })

  if (error) {
    console.error('Failed to log activity:', error)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/activity-log.ts
git commit -m "feat: add logActivity utility function"
```

---

## Task 3: Activity Log Table Component

**Files:**
- Create: `components/admin/ActivityLogTable.tsx`

**Interfaces:**
- Consumes: Activity log data from Supabase
- Produces: `ActivityLogTable` component with expandable rows

- [ ] **Step 1: Create component**

```typescript
// components/admin/ActivityLogTable.tsx
'use client'

import { useState } from 'react'

interface ActivityLog {
  id: string
  admin_email: string
  action: string
  target_type: string
  target_name: string | null
  details: { before?: Record<string, any>; after?: Record<string, any> } | null
  created_at: string
}

interface ActivityLogTableProps {
  logs: ActivityLog[]
}

export default function ActivityLogTable({ logs }: ActivityLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formatAction = (action: string) => {
    return action.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Admin</th>
            <th className="text-left p-3">Action</th>
            <th className="text-left p-3">Target</th>
            <th className="text-left p-3">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <>
              <tr 
                key={log.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <td className="p-3">{formatDate(log.created_at)}</td>
                <td className="p-3">{log.admin_email}</td>
                <td className="p-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {formatAction(log.action)}
                  </span>
                </td>
                <td className="p-3">{log.target_name || log.target_type}</td>
                <td className="p-3">
                  {log.details && (
                    <span className="text-gray-500">
                      {expandedId === log.id ? '▼' : '▶'} View
                    </span>
                  )}
                </td>
              </tr>
              {expandedId === log.id && log.details && (
                <tr key={`${log.id}-details`}>
                  <td colSpan={5} className="p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      {log.details.before && (
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2">Before</h4>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(log.details.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.details.after && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">After</h4>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(log.details.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/ActivityLogTable.tsx
git commit -m "feat: add ActivityLogTable component"
```

---

## Task 4: Activity Log Admin Page

**Files:**
- Create: `app/admin/activity/page.tsx`
- Modify: `components/layout/AdminSidebar.tsx`

**Interfaces:**
- Consumes: `ActivityLogTable` component
- Produces: `/admin/activity` page

- [ ] **Step 1: Create page**

```typescript
// app/admin/activity/page.tsx
import { createClient } from '@/lib/supabase/server'
import ActivityLogTable from '@/components/admin/ActivityLogTable'

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const actionFilter = typeof params.action === 'string' ? params.action : ''

  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (actionFilter) {
    query = query.eq('action', actionFilter)
  }

  const { data: logs } = await query

  const { data: actions } = await supabase
    .from('activity_logs')
    .select('action')
    .order('action')

  const uniqueActions = [...new Set((actions || []).map(l => l.action))].sort()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-4">
        <a 
          href="/admin/activity"
          className={`px-3 py-1 rounded text-sm ${!actionFilter ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
        >
          All
        </a>
        {uniqueActions.map((action) => (
          <a
            key={action}
            href={`/admin/activity?action=${action}`}
            className={`px-3 py-1 rounded text-sm ${actionFilter === action ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
          >
            {action.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </a>
        ))}
      </div>

      {logs && logs.length > 0 ? (
        <ActivityLogTable logs={logs} />
      ) : (
        <p className="text-gray-500">No activity logs yet.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add to AdminSidebar**

Add the Activity Log link after Settings in `components/layout/AdminSidebar.tsx`:

```typescript
// In the navigation array, add:
{
  name: 'Activity Log',
  href: '/admin/activity',
  icon: '📋',
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/activity/page.tsx components/layout/AdminSidebar.tsx
git commit -m "feat: add Activity Log admin page with filtering"
```

---

## Task 5: Add Logging to User Management

**Files:**
- Modify: `components/admin/UserTable.tsx`

**Interfaces:**
- Consumes: `logActivity()` from `lib/activity-log.ts`
- Produces: Log entries for user.approve, user.reject, user.ban

- [ ] **Step 1: Import logActivity**

```typescript
import { logActivity } from '@/lib/activity-log'
```

- [ ] **Step 2: Add logging to handleStatusChange**

After each successful status update, add:

```typescript
// After supabase.rpc('admin_update_user_status', ...)

await logActivity({
  action: `user.${newStatus}`,
  targetType: 'user',
  targetId: userId,
  targetName: userEmail,
  details: {
    before: { status: currentStatus },
    after: { status: newStatus }
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/UserTable.tsx
git commit -m "feat: add logging to user approve/reject/ban actions"
```

---

## Task 6: Add Logging to Events

**Files:**
- Modify: `components/admin/EventForm.tsx`

**Interfaces:**
- Consumes: `logActivity()` from `lib/activity-log.ts`
- Produces: Log entries for event.create, event.update

- [ ] **Step 1: Import logActivity**

```typescript
import { logActivity } from '@/lib/activity-log'
```

- [ ] **Step 2: Add logging to create**

After successful insert:

```typescript
await logActivity({
  action: 'event.create',
  targetType: 'event',
  targetId: data.id,
  targetName: title,
  details: {
    after: { title, event_date: eventDate }
  }
})
```

- [ ] **Step 3: Add logging to update**

After successful update:

```typescript
await logActivity({
  action: 'event.update',
  targetType: 'event',
  targetId: initialData.id,
  targetName: title,
  details: {
    before: { title: initialData.title, event_date: initialData.event_date },
    after: { title, event_date: eventDate }
  }
})
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/EventForm.tsx
git commit -m "feat: add logging to event create/update actions"
```

---

## Task 7: Add Logging to Officers

**Files:**
- Modify: `components/admin/OfficerForm.tsx`

**Interfaces:**
- Consumes: `logActivity()` from `lib/activity-log.ts`
- Produces: Log entries for officer.create, officer.update, officer.delete

- [ ] **Step 1: Import logActivity**

```typescript
import { logActivity } from '@/lib/activity-log'
```

- [ ] **Step 2: Add logging to create**

After successful insert:

```typescript
await logActivity({
  action: 'officer.create',
  targetType: 'officer',
  targetId: data.id,
  targetName: `${name} - ${position}`,
  details: {
    after: { name, position, term_year: termYear }
  }
})
```

- [ ] **Step 3: Add logging to update**

After successful update:

```typescript
await logActivity({
  action: 'officer.update',
  targetType: 'officer',
  targetId: officer.id,
  targetName: `${name} - ${position}`,
  details: {
    before: { name: officer.name, position: officer.position },
    after: { name, position }
  }
})
```

- [ ] **Step 4: Add logging to delete**

After successful delete:

```typescript
await logActivity({
  action: 'officer.delete',
  targetType: 'officer',
  targetId: id,
  targetName: `${officer.name} - ${officer.position}`,
  details: {
    before: { name: officer.name, position: officer.position }
  }
})
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/OfficerForm.tsx
git commit -m "feat: add logging to officer create/update/delete actions"
```

---

## Task 8: Add Logging to Announcements

**Files:**
- Modify: `components/admin/AnnouncementForm.tsx`
- Modify: `components/admin/AnnouncementList.tsx`

**Interfaces:**
- Consumes: `logActivity()` from `lib/activity-log.ts`
- Produces: Log entries for announcement.create, announcement.update, announcement.delete

- [ ] **Step 1: Import logActivity in AnnouncementForm**

```typescript
import { logActivity } from '@/lib/activity-log'
```

- [ ] **Step 2: Add logging to create**

After successful insert:

```typescript
await logActivity({
  action: 'announcement.create',
  targetType: 'announcement',
  targetId: data.id,
  targetName: title,
  details: {
    after: { title, is_pinned: isPinned }
  }
})
```

- [ ] **Step 3: Add logging to update**

After successful update:

```typescript
await logActivity({
  action: 'announcement.update',
  targetType: 'announcement',
  targetId: initialData.id,
  targetName: title,
  details: {
    before: { title: initialData.title, is_pinned: initialData.is_pinned },
    after: { title, is_pinned: isPinned }
  }
})
```

- [ ] **Step 4: Import logActivity in AnnouncementList**

```typescript
import { logActivity } from '@/lib/activity-log'
```

- [ ] **Step 5: Add logging to delete**

After successful delete:

```typescript
await logActivity({
  action: 'announcement.delete',
  targetType: 'announcement',
  targetId: id,
  targetName: title,
  details: {
    before: { title }
  }
})
```

- [ ] **Step 6: Commit**

```bash
git add components/admin/AnnouncementForm.tsx components/admin/AnnouncementList.tsx
git commit -m "feat: add logging to announcement create/update/delete actions"
```

---

## Task 9: Add Logging to Settings

**Files:**
- Modify: `components/admin/SettingsForm.tsx`

**Interfaces:**
- Consumes: `logActivity()` from `lib/activity-log.ts`
- Produces: Log entries for settings.update

- [ ] **Step 1: Import logActivity**

```typescript
import { logActivity } from '@/lib/activity-log'
```

- [ ] **Step 2: Add logging to handleSubmit**

After successful update, log only changed fields:

```typescript
// Track which fields changed
const changes: Record<string, any> = {}
const before: Record<string, any> = {}

if (siteName !== initialData.site_name) {
  before.site_name = initialData.site_name
  changes.site_name = siteName
}
if (tagline !== initialData.tagline) {
  before.tagline = initialData.tagline
  changes.tagline = tagline
}
if (primaryColor !== initialData.primary_color) {
  before.primary_color = initialData.primary_color
  changes.primary_color = primaryColor
}
// ... repeat for other fields

if (Object.keys(changes).length > 0) {
  await logActivity({
    action: 'settings.update',
    targetType: 'settings',
    targetName: 'Organization Settings',
    details: {
      before: Object.keys(before).length > 0 ? before : undefined,
      after: changes
    }
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/SettingsForm.tsx
git commit -m "feat: add logging to settings update actions"
```

---

## Task 10: Log Retention Configuration

**Files:**
- Modify: `components/admin/SettingsForm.tsx`
- Modify: `app/admin/activity/page.tsx`

**Interfaces:**
- Consumes: `log_retention_years` from organization_info
- Produces: Configurable retention + manual cleanup button

- [ ] **Step 1: Add retention config to SettingsForm**

Add a new section in SettingsForm:

```typescript
// State
const [logRetentionYears, setLogRetentionYears] = useState(initialData?.log_retention_years || 0)

// In the form, add section:
<div className="border-t pt-6 mt-6">
  <h3 className="text-lg font-semibold mb-4">Activity Log Settings</h3>
  <div>
    <label className="block text-sm font-medium mb-1">
      Log Retention (years, 0 = forever)
    </label>
    <input
      type="number"
      min="0"
      max="10"
      value={logRetentionYears}
      onChange={(e) => setLogRetentionYears(parseInt(e.target.value) || 0)}
      className="w-full border rounded px-3 py-2"
    />
  </div>
</div>

// In the updateData, include:
log_retention_years: logRetentionYears
```

- [ ] **Step 2: Add cleanup button to Activity Log page**

```typescript
// In app/admin/activity/page.tsx, add:
import CleanupButton from '@/components/admin/CleanupButton'

// After the filter section:
<CleanupButton />
```

- [ ] **Step 3: Create CleanupButton component**

```typescript
// components/admin/CleanupButton.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CleanupButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCleanup = async () => {
    const supabase = createClient()
    
    // Get retention setting
    const { data: settings } = await supabase
      .from('organization_info')
      .select('log_retention_years')
      .single()

    const years = settings?.log_retention_years || 0
    if (years === 0) {
      alert('Log retention is set to forever. Change retention years in Settings to enable cleanup.')
      return
    }

    if (!confirm(`Delete logs older than ${years} years?`)) return

    setLoading(true)

    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years)

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Old logs deleted successfully!')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleCleanup}
      disabled={loading}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? 'Cleaning up...' : 'Clear Old Logs'}
    </button>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/SettingsForm.tsx components/admin/CleanupButton.tsx app/admin/activity/page.tsx
git commit -m "feat: add log retention config and manual cleanup"
```

---

## Task 11: Build and Deploy

- [ ] **Step 1: Run build**

```bash
cd alumni-website && npm run build
```

- [ ] **Step 2: Fix any build errors**

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "feat: activity log system complete"
git push
```

- [ ] **Step 4: Verify on Vercel**

- Check `/admin/activity` page loads
- Verify logs appear after admin actions
- Test filtering by action type
- Test cleanup button

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `007_activity_logs.sql` |
| 2 | Utility function | `lib/activity-log.ts` |
| 3 | Table component | `ActivityLogTable.tsx` |
| 4 | Admin page | `app/admin/activity/page.tsx` |
| 5 | User logging | `UserTable.tsx` |
| 6 | Event logging | `EventForm.tsx` |
| 7 | Officer logging | `OfficerForm.tsx` |
| 8 | Announcement logging | `AnnouncementForm.tsx`, `AnnouncementList.tsx` |
| 9 | Settings logging | `SettingsForm.tsx` |
| 10 | Retention config | `SettingsForm.tsx`, `CleanupButton.tsx` |
| 11 | Build & deploy | - |
