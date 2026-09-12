import { NextResponse } from 'next/server'
import { sendMessage } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { conversationId, recipientId, content } = await request.json()
    const result = await sendMessage(content, conversationId, recipientId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('SEND MESSAGE ERROR:', JSON.stringify(error, null, 2))
    let message = 'Failed to send message'
    if (error?.message) message = error.message
    else if (error?.error?.message) message = error.error.message
    else if (error?.code) message = `${error.code}: ${error.details || error.message || ''}`
    else try { message = JSON.stringify(error) } catch { message = String(error) }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
