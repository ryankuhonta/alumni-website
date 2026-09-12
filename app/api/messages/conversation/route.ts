import { NextResponse } from 'next/server'
import { getOrCreateConversation } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { recipientId } = await request.json()
    const result = await getOrCreateConversation(recipientId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('CONVERSATION API ERROR:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
