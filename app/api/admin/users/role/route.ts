import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-log'

export async function POST(request: Request) {
  try {
    const { userId, newRole } = await request.json()

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 })
    }

    if (!['admin', 'moderator', 'alumni', 'teacher'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user's role
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    // Only admins can change roles
    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 })
    }

    // Get target user info before update
    const { data: targetUser } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single()

    // Update role
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('Error updating role:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the activity
    await logActivity({
      action: 'user.role_changed',
      targetType: 'user',
      targetId: userId,
      targetName: targetUser?.email || userId,
      details: {
        before: { role: targetUser?.role },
        after: { role: newRole }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Role update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 })
  }
}
