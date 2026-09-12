# Direct Messaging Feature Spec

**Date:** 2026-09-12
**Status:** Approved
**Scope:** 1-on-1 async messaging between alumni

## Overview

Add direct messaging functionality allowing alumni to send private messages to each other. Similar to Facebook/Instagram DMs.

## Requirements

### Functional
- Users can start a conversation from any alumni's profile page
- Users can send and receive text messages
- Users can see all their conversations in an inbox
- Users can see unread message count in navbar
- Messages show "Seen" indicator when read
- Conversations are sorted by most recent activity

### Non-functional
- Text messages only (no file attachments in v1)
- 1-on-1 conversations only (group chats in future)
- No real-time updates (manual refresh for v1)
- Must respect user privacy settings

## Database Schema

### Table: conversations
```sql
CREATE TABLE alumni_v2.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: conversation_participants
```sql
CREATE TABLE alumni_v2.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES alumni_v2.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES alumni_v2.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);
```

### Table: messages
```sql
CREATE TABLE alumni_v2.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES alumni_v2.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES alumni_v2.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Start or get conversation
`POST /api/messages/conversation`
```json
{
  "recipientId": "uuid"
}
```
Response:
```json
{
  "conversationId": "uuid",
  "isNew": true
}
```

### Send message
`POST /api/messages/send`
```json
{
  "conversationId": "uuid",
  "content": "Hello!"
}
```

### Get conversations (inbox)
`GET /api/messages/conversations`
Response:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "otherUser": {
        "id": "uuid",
        "firstName": "Juan",
        "lastName": "Dela Cruz",
        "profilePicture": "url"
      },
      "lastMessage": {
        "content": "Hello!",
        "createdAt": "2026-09-12T...",
        "senderId": "uuid"
      },
      "unreadCount": 3
    }
  ]
}
```

### Get messages in conversation
`GET /api/messages/[conversationId]`
Response:
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "content": "Hello!",
      "createdAt": "2026-09-12T...",
      "isOwn": true
    }
  ],
  "otherUser": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "profilePicture": "url"
  }
}
```

### Mark conversation as read
`POST /api/messages/read`
```json
{
  "conversationId": "uuid"
}
```

### Get unread count
`GET /api/messages/unread-count`
Response:
```json
{
  "count": 5
}
```

## UI Components

### 1. MessageButton (`components/directory/MessageButton.tsx`)
- Client component
- Appears on profile page `/directory/[id]`
- On click: calls POST /api/messages/conversation → redirects to /messages/[id]
- Shows "Message" text with mail icon

### 2. InboxList (`components/messages/InboxList.tsx`)
- Client component
- Shows list of conversations
- Each item: profile picture, name, last message preview, timestamp, unread badge
- Click → navigates to /messages/[id]

### 3. ChatThread (`components/messages/ChatThread.tsx`)
- Client component
- Shows messages in chronological order
- Own messages: right-aligned, primary color background
- Other messages: left-aligned, gray background
- Shows "Seen" indicator below last message if read
- Auto-scrolls to bottom on new messages

### 4. MessageInput (`components/messages/MessageInput.tsx`)
- Client component
- Text input with send button
- Enter key sends message
- Disables while sending

### 5. UnreadBadge (`components/layout/UnreadBadge.tsx`)
- Client component
- Shows unread count as red badge
- Polls every 30 seconds for updates
- Appears on Messages link in navbar

## Pages

### `/messages` (Inbox)
- Server component wrapper
- Requires authentication
- Renders InboxList

### `/messages/[id]` (Conversation)
- Server component wrapper
- Requires authentication
- Renders ChatThread + MessageInput
- Marks conversation as read on load

### `/messages/new` (Start conversation)
- Server component wrapper
- Requires authentication
- Reads `?to={userId}` param
- Creates or gets conversation
- Redirects to /messages/[id]

## Modified Files

### `components/layout/Navbar.tsx`
- Add "Messages" link with UnreadBadge
- Show between "Announcements" and "Profile"

### `components/directory/ProfileView.tsx`
- Add MessageButton for other users (not self)
- Only show for logged-in users

### `types/database.ts`
- Add Conversation, ConversationParticipant, Message types

## RLS Policies

```sql
-- Users can only see conversations they participate in
CREATE POLICY "Users can view own conversations" ON alumni_v2.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alumni_v2.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

-- Users can only see messages in their conversations
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

-- Users can update own last_read_at
CREATE POLICY "Users can update own read status" ON alumni_v2.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());
```

## Security Considerations

- All queries use RLS to prevent unauthorized access
- Users can only see conversations they participate in
- Users can only send messages to conversations they're in
- sender_id is always set to auth.uid(), never client-provided
- No file uploads in v1 (avoids storage security complexity)

## Future Enhancements

- Group conversations
- File/image attachments
- Real-time updates via Supabase Realtime
- Typing indicators
- Message reactions
- Message search
- Push notifications
