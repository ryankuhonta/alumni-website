import { NextResponse } from 'next/server'
import { getUnreadCount } from '@/lib/api/messages'

export async function GET() {
  try {
    const count = await getUnreadCount()
    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 })
  }
}
