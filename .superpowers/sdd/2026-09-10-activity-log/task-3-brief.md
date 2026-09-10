# Task 3: Activity Log Table Component

## Task Description

Create a React component to display activity logs in a table with expandable rows.

## Files

- Create: `components/admin/ActivityLogTable.tsx`

## Interfaces

- Consumes: Activity log data from Supabase
- Produces: `ActivityLogTable` component with expandable rows

## Step 1: Create component

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

## Step 2: Commit

```bash
git add components/admin/ActivityLogTable.tsx
git commit -m "feat: add ActivityLogTable component"
```
