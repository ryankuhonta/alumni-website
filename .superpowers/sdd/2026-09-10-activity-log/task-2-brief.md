# Task 2: Activity Log Utility Function

## Task Description

Create a utility function for logging admin activities.

## Files

- Create: `lib/activity-log.ts`

## Interfaces

- Consumes: Supabase browser client
- Produces: `logActivity()` function

## Step 1: Create utility function

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

## Step 2: Commit

```bash
git add lib/activity-log.ts
git commit -m "feat: add logActivity utility function"
```
