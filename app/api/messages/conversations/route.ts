import { NextResponse } from 'next/server'
import { getConversations } from '@/lib/api/messages'

export async function GET() {
  try {
    const conversations = await getConversations()
    return NextResponse.json({ conversations })
  } catch (error: any) {
    console.error('CONVERSATIONS API ERROR:', JSON.stringify(error, null, 2))
    let message = 'Failed to get conversations'
    if (error?.message) message = error.message
    else if (error?.error?.message) message = error.error.message
    else if (error?.code) message = `${error.code}: ${error.details || error.message || ''}`
    else try { message = JSON.stringify(error) } catch { message = String(error) }
    return NextResponse.json({ error: message, conversations: [] }, { status: 500 })
  }
}
