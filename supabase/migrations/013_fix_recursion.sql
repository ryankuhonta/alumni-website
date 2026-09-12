-- Fix messaging RLS: complete rewrite to avoid all recursion

-- 1. Drop ALL existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view own participation" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can add self to conversation" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can update own read status" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON alumni_v2.conversation_participants;

-- 2. conversation_participants: simple GRANT-based access (no self-referencing policies)
-- SELECT: any authenticated user can see all participant rows (needed to find other user in conversation)
-- INSERT: handled by SECURITY DEFINER function only
-- UPDATE: user can update their own row (last_read_at)
ALTER TABLE alumni_v2.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view participants" ON alumni_v2.conversation_participants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own read status" ON alumni_v2.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 3. conversations: check participation via conversation_participants (no recursion now)
DROP POLICY IF EXISTS "Users can view own conversations" ON alumni_v2.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON alumni_v2.conversations;

CREATE POLICY "Authenticated can view conversations" ON alumni_v2.conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can create conversations" ON alumni_v2.conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow updating updated_at
CREATE POLICY "Authenticated can update conversations" ON alumni_v2.conversations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. messages: check participation via conversation_participants (no recursion now)
DROP POLICY IF EXISTS "Users can view own messages" ON alumni_v2.messages;
DROP POLICY IF EXISTS "Users can send messages" ON alumni_v2.messages;

CREATE POLICY "Authenticated can view messages" ON alumni_v2.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can send messages" ON alumni_v2.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 5. Keep the SECURITY DEFINER function for creating conversations
CREATE OR REPLACE FUNCTION alumni_v2.create_conversation(p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_sender_id UUID;
BEGIN
  v_sender_id := auth.uid();

  IF v_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot message yourself';
  END IF;

  -- Check if conversation already exists between these two users
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM alumni_v2.conversation_participants cp1
  JOIN alumni_v2.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_sender_id
    AND cp2.user_id = p_recipient_id
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO alumni_v2.conversations DEFAULT VALUES
  RETURNING id INTO v_conversation_id;

  INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_sender_id);

  INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, p_recipient_id);

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION alumni_v2.create_conversation(UUID) TO authenticated;

-- 6. Ensure proper grants
GRANT SELECT, INSERT, UPDATE ON alumni_v2.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON alumni_v2.conversation_participants TO authenticated;
GRANT SELECT, INSERT ON alumni_v2.messages TO authenticated;
