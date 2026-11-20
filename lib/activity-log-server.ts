import { createClient } from '@/lib/supabase/server'

export interface LogActivityParams {
  action: string
  targetType: string
  targetId?: string
  targetName?: string
  details?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
}

/**
 * Server-side activity logger.
 *
 * `logActivity` in `lib/activity-log.ts` uses the browser Supabase client, so it
 * silently skips writes when called from a route handler (no session). API
 * routes must use this helper instead.
 */
export async function logActivityServer(params: LogActivityParams): Promise<void> {
  const supabase = await createClient()

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
