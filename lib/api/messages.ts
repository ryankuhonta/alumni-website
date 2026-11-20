import { createClient } from '@/lib/supabase/server'
import { ConversationWithDetails, ConversationDetails, ConversationUser, MessageWithSender } from '@/types/messaging'

interface ConversationRow {
  id: string
  created_at: string
  updated_at: string
  conversation_type: 'direct' | 'batch'
  batch_year: number | null
  title: string | null
  member_count: number | string | null
  other_user_id: string | null
  other_first_name: string | null
  other_last_name: string | null
  other_profile_picture: string | null
  last_message_content: string | null
  last_message_created_at: string | null
  last_message_sender_id: string | null
  last_message_sender_first_name: string | null
  last_message_is_own: boolean | null
  unread_count: number | string | null
}

interface ConversationDetailsRow {
  id: string
  conversation_type: 'direct' | 'batch'
  batch_year: number | null
  title: string | null
  member_count: number | string | null
  other_user_id: string | null
  other_first_name: string | null
  other_last_name: string | null
  other_profile_picture: string | null
  viewer_id: string
}

interface SenderRow {
  first_name: string
  last_name: string
  profile_picture: string | null
}

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender: SenderRow | SenderRow[] | null
}

const MESSAGE_COLUMNS =
  'id, conversation_id, sender_id, content, created_at, sender:users(first_name, last_name, profile_picture)'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

function mapOtherUser(row: {
  other_user_id: string | null
  other_first_name: string | null
  other_last_name: string | null
  other_profile_picture: string | null
}): ConversationUser | null {
  if (!row.other_user_id) return null

  return {
    id: row.other_user_id,
    first_name: row.other_first_name ?? '',
    last_name: row.other_last_name ?? '',
    profile_picture: row.other_profile_picture,
  }
}

function mapMessageRow(row: MessageRow, currentUserId: string): MessageWithSender {
  const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender

  return {
    id: row.id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
    isOwn: row.sender_id === currentUserId,
    sender: sender || { first_name: 'Unknown', last_name: '', profile_picture: null },
  }
}

export async function getOrCreateConversation(recipientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use SECURITY DEFINER function to avoid RLS recursion
  const { data, error } = await supabase
    .rpc('create_conversation', { p_recipient_id: recipientId })

  if (error) {
    console.error('create_conversation error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to create conversation')
  }

  return { conversationId: data, isNew: true }
}

export async function sendMessage(content: string, conversationId?: string, recipientId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // If no conversationId, create conversation with recipient
  if (!conversationId) {
    if (!recipientId) throw new Error('Either conversationId or recipientId is required')
    const { data, error } = await supabase
      .rpc('create_conversation', { p_recipient_id: recipientId })
    if (error) throw new Error(error.message || 'Failed to create conversation')
    conversationId = data
  }

  const { data: inserted, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })
    .select(MESSAGE_COLUMNS)
    .single()

  if (error) throw error

  // conversations.updated_at is maintained by the messages_touch_conversation
  // trigger (migration 025), so no extra UPDATE is needed here.

  return { conversationId, message: mapMessageRow(inserted as MessageRow, user.id) }
}

export async function getConversations(): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('get_conversations')

  if (error) {
    console.error('get_conversations error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to get conversations')
  }

  return ((data ?? []) as ConversationRow[]).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    type: row.conversation_type,
    batchYear: row.batch_year,
    title: row.title,
    memberCount: row.member_count === null || row.member_count === undefined ? null : Number(row.member_count),
    otherUser: mapOtherUser(row),
    lastMessage: row.last_message_created_at
      ? {
          content: row.last_message_content ?? '',
          created_at: row.last_message_created_at,
          sender_id: row.last_message_sender_id ?? '',
          senderFirstName: row.last_message_sender_first_name,
          isOwn: Boolean(row.last_message_is_own),
        }
      : null,
    unreadCount: Number(row.unread_count ?? 0),
  }))
}

export async function getConversationDetails(conversationId: string): Promise<ConversationDetails | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_conversation', { p_conversation_id: conversationId })

  if (error) {
    console.error('get_conversation error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to get conversation')
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConversationDetailsRow | undefined
  if (!row) return null

  return {
    id: row.id,
    type: row.conversation_type,
    batchYear: row.batch_year,
    title: row.title,
    memberCount: row.member_count === null || row.member_count === undefined ? null : Number(row.member_count),
    otherUser: mapOtherUser(row),
    viewerId: row.viewer_id,
  }
}

export async function getMessages(
  conversationId: string,
  viewerId: string,
  options?: { before?: string | null; limit?: number }
): Promise<{ messages: MessageWithSender[]; hasMore: boolean }> {
  const supabase = await createClient()
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)

  let query = supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  const { data, error } = await query

  if (error) {
    console.error('getMessages error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to get messages')
  }

  const rows = (data ?? []) as MessageRow[]
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  return {
    messages: page.reverse().map((row) => mapMessageRow(row, viewerId)),
    hasMore,
  }
}

export async function markAsRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // Single aggregate query (migration 025).
  const { data, error } = await supabase.rpc('get_unread_message_count')

  if (error) {
    console.error('get_unread_message_count error:', JSON.stringify(error))
    return 0
  }

  return Number(data ?? 0)
}
