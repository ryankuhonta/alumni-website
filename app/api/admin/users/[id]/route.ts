import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-log'

const MIN_BATCH_YEAR = 1970

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can edit users' }, { status: 403 })
    }

    const updates: { first_name?: string; last_name?: string; batch_year?: number } = {}

    if (body.firstName !== undefined) {
      const firstName = String(body.firstName).trim()
      if (!firstName) {
        return NextResponse.json({ error: 'First name cannot be empty' }, { status: 400 })
      }
      updates.first_name = firstName
    }

    if (body.lastName !== undefined) {
      const lastName = String(body.lastName).trim()
      if (!lastName) {
        return NextResponse.json({ error: 'Last name cannot be empty' }, { status: 400 })
      }
      updates.last_name = lastName
    }

    if (body.batchYear !== undefined) {
      const batchYear = Number(body.batchYear)
      const currentYear = new Date().getFullYear()
      const isValid =
        Number.isInteger(batchYear) &&
        (batchYear === 0 || (batchYear >= MIN_BATCH_YEAR && batchYear <= currentYear))

      if (!isValid) {
        return NextResponse.json(
          { error: `Batch year must be 0 (teacher) or between ${MIN_BATCH_YEAR} and ${currentYear}` },
          { status: 400 }
        )
      }
      updates.batch_year = batchYear
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: before } = await supabase
      .from('users')
      .select('first_name, last_name, batch_year, email')
      .eq('id', id)
      .single()

    if (!before) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('first_name, last_name, batch_year')
      .single()

    if (error) {
      console.error('Error updating user details:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logActivity({
      action: 'user.details_updated',
      targetType: 'user',
      targetId: id,
      targetName: before.email,
      details: {
        before: {
          first_name: before.first_name,
          last_name: before.last_name,
          batch_year: before.batch_year,
        },
        after: {
          first_name: updated?.first_name,
          last_name: updated?.last_name,
          batch_year: updated?.batch_year,
        },
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
