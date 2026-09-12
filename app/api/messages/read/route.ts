import { NextResponse } from 'next/server'
import { markAsRead } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()
    await markAsRead(conversationId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
