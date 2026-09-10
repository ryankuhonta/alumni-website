# Task 10: Log Retention Configuration

## Task Description

Add configurable log retention settings and a manual cleanup button.

## Files to Modify

- `components/admin/SettingsForm.tsx` (add retention config)
- `app/admin/activity/page.tsx` (add cleanup button)
- Create: `components/admin/CleanupButton.tsx`

## Interfaces

- Consumes: `log_retention_years` from organization_info
- Produces: Configurable retention + manual cleanup button

## Step 1: Add retention config to SettingsForm

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

## Step 2: Add cleanup button to Activity Log page

```typescript
// In app/admin/activity/page.tsx, add:
import CleanupButton from '@/components/admin/CleanupButton'

// After the filter section:
<CleanupButton />
```

## Step 3: Create CleanupButton component

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

## Step 4: Commit

```bash
git add components/admin/SettingsForm.tsx components/admin/CleanupButton.tsx app/admin/activity/page.tsx
git commit -m "feat: add log retention config and manual cleanup"
```
