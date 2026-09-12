import { NextResponse } from 'next/server'
import { getConversations } from '@/lib/api/messages'

export async function GET() {
  try {
    const conversations = await getConversations()
    return NextResponse.json({ conversations })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 })
  }
}
