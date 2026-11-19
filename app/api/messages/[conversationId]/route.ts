import { NextResponse } from 'next/server'
import { getMessages } from '@/lib/api/messages'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const before = searchParams.get('before')
    const limitParam = Number(searchParams.get('limit'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined

    const { messages, hasMore } = await getMessages(conversationId, { before, limit })
    return NextResponse.json({ messages, hasMore })
  } catch (error) {
    console.error('GET MESSAGES ERROR:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}
