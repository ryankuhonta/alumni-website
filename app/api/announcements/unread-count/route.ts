import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ count: 0 })

    // Get user's last viewed timestamp
    const { data: profile } = await supabase
      .from('users')
      .select('last_viewed_announcements')
      .eq('id', user.id)
      .single()

    const lastViewed = profile?.last_viewed_announcements

    // Count announcements newer than last viewed (or all if never viewed)
    let query = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })

    if (lastViewed) {
      query = query.gt('created_at', lastViewed)
    }

    const { count } = await query

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}
