import { NextResponse } from 'next/server'
import { getConversationDetails, getMessages } from '@/lib/api/messages'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const conversation = await getConversationDetails(conversationId)

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const before = searchParams.get('before')
    const limitParam = Number(searchParams.get('limit'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined

    const { messages, hasMore } = await getMessages(conversationId, conversation.viewerId, { before, limit })

    return NextResponse.json({ conversation, messages, hasMore })
  } catch (error) {
    console.error('GET MESSAGES ERROR:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}
