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
