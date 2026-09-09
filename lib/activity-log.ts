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
  console.log('logActivity called:', params)
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  console.log('Current user:', user?.id, user?.email)
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
  } else {
    console.log('Activity logged successfully')
  }
}
