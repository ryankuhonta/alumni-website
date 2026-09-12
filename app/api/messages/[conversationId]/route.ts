import { NextResponse } from 'next/server'
import { getMessages } from '@/lib/api/messages'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const messages = await getMessages(conversationId)
    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}
