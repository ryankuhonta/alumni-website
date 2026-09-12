-- Fix infinite recursion in conversation_participants RLS policies

-- 1. Drop ALL existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view conversation participants" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can update own read status" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can view own participation" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can add self to conversation" ON alumni_v2.conversation_participants;

-- 2. SECURITY DEFINER function to create conversation with both participants
-- This bypasses RLS entirely, safe because it validates auth.uid()
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

  -- Don't allow messaging yourself
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

  -- If exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO alumni_v2.conversations DEFAULT VALUES
  RETURNING id INTO v_conversation_id;

  -- Add both participants
  INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_sender_id);

  INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, p_recipient_id);

  RETURN v_conversation_id;
END;
$$;

-- 3. Recreate simple non-recursive policies

-- SELECT: users can only see their own participation records
CREATE POLICY "Users can view own participation" ON alumni_v2.conversation_participants
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: managed by SECURITY DEFINER function, but allow direct inserts for own user_id
CREATE POLICY "Users can add self to conversation" ON alumni_v2.conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: users can update their own read status
CREATE POLICY "Users can update own read status" ON alumni_v2.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 4. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION alumni_v2.create_conversation(UUID) TO authenticated;
