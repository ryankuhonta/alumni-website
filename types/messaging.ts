export interface Conversation {
  id: string
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  last_read_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface ConversationWithDetails {
  id: string
  created_at: string
  updated_at: string
  otherUser: {
    id: string
    first_name: string
    last_name: string
    profile_picture: string | null
  }
  lastMessage: {
    content: string
    created_at: string
    sender_id: string
  } | null
  unreadCount: number
}

export interface MessageWithSender {
  id: string
  sender_id: string
  content: string
  created_at: string
  isOwn: boolean
  sender: {
    first_name: string
    last_name: string
    profile_picture: string | null
  }
}
