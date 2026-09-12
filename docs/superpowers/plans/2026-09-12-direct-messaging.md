# Direct Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 1-on-1 direct messaging between alumni with inbox, chat thread, and unread badges.

**Architecture:** New database tables (conversations, conversation_participants, messages) with API routes for CRUD operations. Client components for inbox list, chat thread, and message input. Unread badge polling on navbar.

**Tech Stack:** Next.js App Router, Supabase PostgreSQL, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-09-12-direct-messaging-design.md`

## Global Constraints
- Schema: `alumni_v2`
- Auth: Supabase Auth with `auth.uid()` for RLS
- UI: Tailwind CSS, match existing component patterns
- No real-time in v1 (polling for updates)
- Text messages only (no file attachments)

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/012_messaging.sql` | Database tables + RLS policies |
| `types/messaging.ts` | TypeScript types for messaging |
| `lib/api/messages.ts` | Server-side message API functions |
| `app/api/messages/conversation/route.ts` | Start/get conversation endpoint |
| `app/api/messages/send/route.ts` | Send message endpoint |
| `app/api/messages/conversations/route.ts` | Get inbox endpoint |
| `app/api/messages/[conversationId]/route.ts` | Get messages endpoint |
| `app/api/messages/read/route.ts` | Mark as read endpoint |
| `app/api/messages/unread-count/route.ts` | Get unread count endpoint |
| `app/messages/page.tsx` | Inbox page |
| `app/messages/[id]/page.tsx` | Conversation page |
| `app/messages/new/page.tsx` | Start conversation redirect |
| `components/messages/InboxList.tsx` | Inbox conversation list |
| `components/messages/ChatThread.tsx` | Message thread display |
| `components/messages/MessageInput.tsx` | Text input + send |
| `components/messages/UnreadBadge.tsx` | Unread count badge |
| `components/directory/MessageButton.tsx` | "Send Message" button |

### Modified Files
| File | Change |
|------|--------|
| `components/layout/Navbar.tsx` | Add Messages link + UnreadBadge |
| `components/directory/ProfileView.tsx` | Add MessageButton |
| `types/database.ts` | Add messaging types |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/012_messaging.sql`

**Interfaces:**
- Consumes: None
- Produces: conversations, conversation_participants, messages tables with RLS

- [ ] **Step 1: Create migration file**

```sql
-- Migration 012: Direct Messaging

-- Conversations table
CREATE TABLE alumni_v2.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE alumni_v2.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES alumni_v2.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES alumni_v2.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE alumni_v2.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES alumni_v2.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES alumni_v2.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversation_participants_user ON alumni_v2.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON alumni_v2.conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation ON alumni_v2.messages(conversation_id);
CREATE INDEX idx_messages_created ON alumni_v2.messages(created_at);

-- RLS policies
ALTER TABLE alumni_v2.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_v2.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_v2.messages ENABLE ROW LEVEL SECURITY;

-- Users can see conversations they participate in
CREATE POLICY "Users can view own conversations" ON alumni_v2.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON alumni_v2.conversations
  FOR INSERT WITH CHECK (true);

-- Users can see participants in their conversations
CREATE POLICY "Users can view conversation participants" ON alumni_v2.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- Users can add participants to conversations they're in
CREATE POLICY "Users can add participants" ON alumni_v2.conversation_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumni_v2.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- Users can update own read status
CREATE POLICY "Users can update own read status" ON alumni_v2.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Users can see messages in their conversations
CREATE POLICY "Users can view own messages" ON alumni_v2.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Users can send messages to their conversations
CREATE POLICY "Users can send messages" ON alumni_v2.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM alumni_v2.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON alumni_v2.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON alumni_v2.conversation_participants TO authenticated;
GRANT SELECT, INSERT ON alumni_v2.messages TO authenticated;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/012_messaging.sql
git commit -m "feat: add messaging database migration"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `types/messaging.ts`

**Interfaces:**
- Consumes: None
- Produces: Conversation, ConversationParticipant, Message, ConversationWithDetails, MessageWithSender types

- [ ] **Step 1: Create types file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add types/messaging.ts
git commit -m "feat: add messaging TypeScript types"
```

---

### Task 3: Server API Functions

**Files:**
- Create: `lib/api/messages.ts`

**Interfaces:**
- Consumes: types/messaging.ts
- Produces: getOrCreateConversation, sendMessage, getConversations, getMessages, markAsRead, getUnreadCount functions

- [ ] **Step 1: Create API functions**

```typescript
import { createClient } from '@/lib/supabase/server'
import { ConversationWithDetails, MessageWithSender } from '@/types/messaging'

export async function getOrCreateConversation(recipientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if conversation already exists
  const { data: existingParticipant } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)
    .single()

  if (existingParticipant) {
    // Check if recipient is in same conversation
    const { data: recipientParticipant } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', existingParticipant.conversation_id)
      .eq('user_id', recipientId)
      .single()

    if (recipientParticipant) {
      return { conversationId: existingParticipant.conversation_id, isNew: false }
    }
  }

  // Create new conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single()

  if (convError) throw convError

  // Add both participants
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: recipientId },
    ])

  if (partError) throw partError

  return { conversationId: conversation.id, isNew: true }
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/api/messages.ts
git commit -m "feat: add messaging API functions"
```

---

### Task 4: API Routes

**Files:**
- Create: `app/api/messages/conversation/route.ts`
- Create: `app/api/messages/send/route.ts`
- Create: `app/api/messages/conversations/route.ts`
- Create: `app/api/messages/[conversationId]/route.ts`
- Create: `app/api/messages/read/route.ts`
- Create: `app/api/messages/unread-count/route.ts`

**Interfaces:**
- Consumes: lib/api/messages.ts
- Produces: HTTP API endpoints

- [ ] **Step 1: Create conversation route**

```typescript
// app/api/messages/conversation/route.ts
import { NextResponse } from 'next/server'
import { getOrCreateConversation } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { recipientId } = await request.json()
    const result = await getOrCreateConversation(recipientId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create send route**

```typescript
// app/api/messages/send/route.ts
import { NextResponse } from 'next/server'
import { sendMessage } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { conversationId, content } = await request.json()
    await sendMessage(conversationId, content)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create conversations list route**

```typescript
// app/api/messages/conversations/route.ts
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
```

- [ ] **Step 4: Create messages route**

```typescript
// app/api/messages/[conversationId]/route.ts
import { NextResponse } from 'next/server'
import { getMessages } from '@/lib/api/messages'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const messages = await getMessages(conversationId)
    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Create read route**

```typescript
// app/api/messages/read/route.ts
import { NextResponse } from 'next/server'
import { markAsRead } from '@/lib/api/messages'

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()
    await markAsRead(conversationId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Create unread count route**

```typescript
// app/api/messages/unread-count/route.ts
import { NextResponse } from 'next/server'
import { getUnreadCount } from '@/lib/api/messages'

export async function GET() {
  try {
    const count = await getUnreadCount()
    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add app/api/messages/
git commit -m "feat: add messaging API routes"
```

---

### Task 5: MessageButton Component

**Files:**
- Create: `components/directory/MessageButton.tsx`

**Interfaces:**
- Consumes: /api/messages/conversation
- Produces: MessageButton component

- [ ] **Step 1: Create component**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MessageButtonProps {
  userId: string
}

export default function MessageButton({ userId }: MessageButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messages/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId }),
      })
      const data = await res.json()
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`)
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
      style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {loading ? 'Starting...' : 'Message'}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/directory/MessageButton.tsx
git commit -m "feat: add MessageButton component"
```

---

### Task 6: Update ProfileView

**Files:**
- Modify: `components/directory/ProfileView.tsx`

**Interfaces:**
- Consumes: MessageButton component
- Produces: Updated ProfileView with Message button

- [ ] **Step 1: Read current ProfileView**

Read `components/directory/ProfileView.tsx` to understand current structure.

- [ ] **Step 2: Add MessageButton import and usage**

Add import at top:
```typescript
import MessageButton from './MessageButton'
```

Add button after the profile info section, before the social links. Only show if:
- User is logged in (pass currentUserId prop)
- It's not the user's own profile

- [ ] **Step 3: Commit**

```bash
git add components/directory/ProfileView.tsx
git commit -m "feat: add Message button to profile page"
```

---

### Task 7: InboxList Component

**Files:**
- Create: `components/messages/InboxList.tsx`

**Interfaces:**
- Consumes: /api/messages/conversations
- Produces: InboxList component

- [ ] **Step 1: Create component**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConversationWithDetails } from '@/types/messaging'

export default function InboxList() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading conversations...</div>
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No conversations yet</p>
        <p className="text-sm text-gray-400">
          Start a conversation by visiting an alumni&apos;s profile and clicking &quot;Message&quot;
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/messages/${conv.id}`}
          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
        >
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {conv.otherUser.profile_picture ? (
              <img
                src={conv.otherUser.profile_picture}
                alt={`${conv.otherUser.first_name} ${conv.otherUser.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-gray-400">
                {conv.otherUser.first_name[0]}{conv.otherUser.last_name[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate">
                {conv.otherUser.first_name} {conv.otherUser.last_name}
              </h3>
              {conv.lastMessage && (
                <span className="text-xs text-gray-500">
                  {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {conv.lastMessage && (
              <p className="text-sm text-gray-500 truncate">
                {conv.lastMessage.sender_id === conv.otherUser.id ? '' : 'You: '}
                {conv.lastMessage.content}
              </p>
            )}
          </div>
          {conv.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {conv.unreadCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/messages/InboxList.tsx
git commit -m "feat: add InboxList component"
```

---

### Task 8: ChatThread Component

**Files:**
- Create: `components/messages/ChatThread.tsx`

**Interfaces:**
- Consumes: /api/messages/[conversationId], /api/messages/read
- Produces: ChatThread component

- [ ] **Step 1: Create component**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageWithSender } from '@/types/messaging'

interface ChatThreadProps {
  conversationId: string
}

export default function ChatThread({ conversationId }: ChatThreadProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    markAsRead()
  }, [conversationId])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading messages...</div>
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No messages yet. Send the first message!
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-lg px-4 py-2 ${
              msg.isOwn
                ? 'text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}
            style={msg.isOwn ? { backgroundColor: 'var(--primary-color)' } : undefined}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <p className={`text-xs mt-1 ${msg.isOwn ? 'text-white/70' : 'text-gray-500'}`}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/messages/ChatThread.tsx
git commit -m "feat: add ChatThread component"
```

---

### Task 9: MessageInput Component

**Files:**
- Create: `components/messages/MessageInput.tsx`

**Interfaces:**
- Consumes: /api/messages/send
- Produces: MessageInput component

- [ ] **Step 1: Create component**

```typescript
'use client'

import { useState } from 'react'

interface MessageInputProps {
  conversationId: string
  onMessageSent: () => void
}

export default function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim() || sending) return

    setSending(true)
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content: content.trim() }),
      })
      setContent('')
      onMessageSent()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="text-white px-4 py-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/messages/MessageInput.tsx
git commit -m "feat: add MessageInput component"
```

---

### Task 10: UnreadBadge Component

**Files:**
- Create: `components/messages/UnreadBadge.tsx`

**Interfaces:**
- Consumes: /api/messages/unread-count
- Produces: UnreadBadge component

- [ ] **Step 1: Create component**

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/messages/unread-count')
      const data = await res.json()
      setCount(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  if (count === 0) return null

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {count > 99 ? '99+' : count}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/messages/UnreadBadge.tsx
git commit -m "feat: add UnreadBadge component"
```

---

### Task 11: Update Navbar

**Files:**
- Modify: `components/layout/Navbar.tsx`

**Interfaces:**
- Consumes: UnreadBadge component
- Produces: Updated Navbar with Messages link

- [ ] **Step 1: Read current Navbar**

Read `components/layout/Navbar.tsx` to understand current structure.

- [ ] **Step 2: Add Messages link with badge**

Add import:
```typescript
import UnreadBadge from '@/components/messages/UnreadBadge'
```

Add Messages link in the navigation, between Announcements and Profile:
```typescript
<div className="relative">
  <a href="/messages" className="hover:underline">Messages</a>
  <UnreadBadge />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat: add Messages link to navbar with unread badge"
```

---

### Task 12: Messages Pages

**Files:**
- Create: `app/messages/page.tsx`
- Create: `app/messages/[id]/page.tsx`
- Create: `app/messages/new/page.tsx`

**Interfaces:**
- Consumes: InboxList, ChatThread, MessageInput components
- Produces: Messages pages

- [ ] **Step 1: Create inbox page**

```typescript
// app/messages/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InboxList from '@/components/messages/InboxList'

export const metadata = {
  title: 'Messages',
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        <div className="bg-white border rounded-lg">
          <InboxList />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create conversation page**

```typescript
// app/messages/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatThread from '@/components/messages/ChatThread'
import MessageInput from '@/components/messages/MessageInput'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Conversation - Messages` }
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params

  if (!user) redirect('/login')

  // Verify user is participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .single()

  if (!participant) notFound()

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white border rounded-lg h-[calc(100vh-200px)] flex flex-col">
          <ChatThread conversationId={id} />
          <MessageInput
            conversationId={id}
            onMessageSent={() => window.location.reload()}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create new conversation redirect page**

```typescript
// app/messages/new/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  if (!user) redirect('/login')
  if (!params.to) redirect('/messages')

  // Create or get conversation
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_or_create_conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ recipient_id: params.to }),
  })

  const { conversationId } = await res.json()
  redirect(`/messages/${conversationId}`)
}
```

- [ ] **Step 4: Commit**

```bash
git add app/messages/
git commit -m "feat: add Messages pages"
```

---

### Task 13: Update ProfileView with Message Button

**Files:**
- Modify: `components/directory/ProfileView.tsx`

**Interfaces:**
- Consumes: MessageButton component
- Produces: ProfileView with Message button

- [ ] **Step 1: Add MessageButton to profile**

Import and add MessageButton component in the profile page. Only show for logged-in users viewing other profiles.

- [ ] **Step 2: Commit**

```bash
git add components/directory/ProfileView.tsx
git commit -m "feat: add Message button to profile view"
```

---

### Task 14: Build and Test

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Working messaging feature

- [ ] **Step 1: Run build**

```bash
npm run build
```

- [ ] **Step 2: Test flow**

1. Login as user A
2. Visit user B's profile
3. Click "Message"
4. Type and send a message
5. Login as user B
6. See unread badge on navbar
7. Open Messages inbox
8. See conversation with unread indicator
9. Open conversation
10. See messages + "Seen" indicator

- [ ] **Step 3: Fix any issues**

- [ ] **Step 4: Commit final changes**

```bash
git add -A
git commit -m "feat: complete direct messaging feature"
```

---

## Summary

| Task | Description | Status |
|------|-------------|--------|
| 1 | Database migration | - [ ] |
| 2 | TypeScript types | - [ ] |
| 3 | Server API functions | - [ ] |
| 4 | API routes | - [ ] |
| 5 | MessageButton component | - [ ] |
| 6 | Update ProfileView | - [ ] |
| 7 | InboxList component | - [ ] |
| 8 | ChatThread component | - [ ] |
| 9 | MessageInput component | - [ ] |
| 10 | UnreadBadge component | - [ ] |
| 11 | Update Navbar | - [ ] |
| 12 | Messages pages | - [ ] |
| 13 | Update ProfileView | - [ ] |
| 14 | Build and test | - [ ] |
