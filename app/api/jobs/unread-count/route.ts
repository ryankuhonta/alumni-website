import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ count: 0 })

    const { data: profile } = await supabase
      .from('users')
      .select('last_viewed_jobs')
      .eq('id', user.id)
      .single()

    const lastViewed = profile?.last_viewed_jobs

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (lastViewed) {
      query = query.gt('created_at', lastViewed)
    }

    const { count } = await query

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}
