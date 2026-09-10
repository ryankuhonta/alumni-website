# Task 4: Activity Log Admin Page

## Task Description

Create the admin page for viewing activity logs with filtering, and add a link to the admin sidebar.

## Files

- Create: `app/admin/activity/page.tsx`
- Modify: `components/layout/AdminSidebar.tsx`

## Interfaces

- Consumes: `ActivityLogTable` component
- Produces: `/admin/activity` page

## Step 1: Create page

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

## Step 2: Add to AdminSidebar

Add the Activity Log link after Settings in `components/layout/AdminSidebar.tsx`:

```typescript
// In the navigation array, add:
{
  name: 'Activity Log',
  href: '/admin/activity',
  icon: '📋',
}
```

## Step 3: Commit

```bash
git add app/admin/activity/page.tsx components/layout/AdminSidebar.tsx
git commit -m "feat: add Activity Log admin page with filtering"
```
