import { createClient } from '@/lib/supabase/server'
import { ConversationWithDetails, MessageWithSender } from '@/types/messaging'

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

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })

  if (error) throw error

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
}

export async function getConversations(): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get all conversations user is in
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (!participants || participants.length === 0) return []

  const conversationIds = participants.map(p => p.conversation_id)

  // Get conversations with details
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false })

  if (!conversations) return []

  // Get other user and last message for each conversation
  const results: ConversationWithDetails[] = []

  for (const conv of conversations) {
    // Get other participant
    const { data: otherParticipant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conv.id)
      .neq('user_id', user.id)
      .single()

    if (!otherParticipant) continue

    // Get other user details
    const { data: otherUser } = await supabase
      .from('users')
      .select('id, first_name, last_name, profile_picture')
      .eq('id', otherParticipant.user_id)
      .single()

    if (!otherUser) continue

    // Get last message
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('content, created_at, sender_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Skip conversations with no messages (empty conversations)
    if (!lastMessage) continue

    // Get unread count
    const { data: myParticipant } = await supabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', conv.id)
      .eq('user_id', user.id)
      .single()

    let unreadCount = 0
    if (myParticipant && lastMessage) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .gt('created_at', myParticipant.last_read_at)

      unreadCount = count || 0
    }

    results.push({
      ...conv,
      otherUser,
      lastMessage,
      unreadCount,
    })
  }

  return results
}

export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify user is participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) throw new Error('Not authorized')

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (!messages) return []

  // Get sender details
  const results: MessageWithSender[] = []

  for (const msg of messages) {
    const { data: sender } = await supabase
      .from('users')
      .select('first_name, last_name, profile_picture')
      .eq('id', msg.sender_id)
      .single()

    results.push({
      ...msg,
      isOwn: msg.sender_id === user.id,
      sender: sender || { first_name: 'Unknown', last_name: '', profile_picture: null },
    })
  }

  return results
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

  // Get all conversations user is in
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)

  if (!participants || participants.length === 0) return 0

  let totalUnread = 0

  for (const p of participants) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', p.conversation_id)
      .neq('sender_id', user.id)
      .gt('created_at', p.last_read_at)

    totalUnread += count || 0
  }

  return totalUnread
}
