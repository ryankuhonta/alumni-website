import { NextResponse } from 'next/server'
import { getOrCreateConversation } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { recipientId } = await request.json()
    const result = await getOrCreateConversation(recipientId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('CONVERSATION API ERROR:', JSON.stringify(error, null, 2))
    let message = 'Failed to create conversation'
    if (error?.message) message = error.message
    else if (error?.error?.message) message = error.error.message
    else if (error?.error?.details) message = error.error.details
    else if (typeof error === 'string') message = error
    else if (error?.code) message = `${error.code}: ${error.details || error.message || ''}`
    else try { message = JSON.stringify(error) } catch { message = String(error) }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
