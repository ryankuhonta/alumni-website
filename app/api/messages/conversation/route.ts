import { NextResponse } from 'next/server'
import { getOrCreateConversation } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { recipientId } = await request.json()
    const result = await getOrCreateConversation(recipientId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
