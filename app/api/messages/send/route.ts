import { NextResponse } from 'next/server'
import { sendMessage } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { conversationId, content } = await request.json()
    await sendMessage(conversationId, content)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
