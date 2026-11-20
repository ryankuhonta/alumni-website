-- Migration 026: Messaging RLS hardening
--
-- Why: 013_fix_recursion.sql replaced the messaging policies with
-- `auth.role() = 'authenticated'`. That stopped the recursion errors, but it
-- also means any logged-in user can read EVERY conversation, participant row
-- and message with the public anon key.
--
-- This migration restores per-user access without bringing back recursion:
--   * a SECURITY DEFINER helper checks participation. Because the function is
--     owned by the table owner, the lookup inside it bypasses RLS, so policies
--     can call it without recursing.
--   * conversations are read-only for clients; creation and updated_at are
--     handled by SECURITY DEFINER functions (create_conversation and the
--     messages_touch_conversation trigger).
--   * participants can only be read for conversations you belong to, and your
--     own row can only be updated in place (last_read_at), not moved to
--     another conversation.
--   * messages are readable/insertable only by participants.
--
-- No application code change is required: the inbox and unread-count RPCs
-- already filter by auth.uid() and bypass RLS as DEFINER functions.

-- 1. Participation helper ---------------------------------------------------

CREATE OR REPLACE FUNCTION alumni_v2.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = alumni_v2, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM alumni_v2.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION alumni_v2.is_conversation_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION alumni_v2.is_conversation_participant(uuid) TO authenticated;

-- 2. Conversations ----------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated can view conversations" ON alumni_v2.conversations;
DROP POLICY IF EXISTS "Authenticated can create conversations" ON alumni_v2.conversations;
DROP POLICY IF EXISTS "Authenticated can update conversations" ON alumni_v2.conversations;

CREATE POLICY "Users can view own conversations" ON alumni_v2.conversations
  FOR SELECT USING (alumni_v2.is_conversation_participant(id));

-- Conversation rows are only created by create_conversation() and their
-- updated_at is only written by the messages trigger. Both are SECURITY
-- DEFINER, so clients do not need INSERT/UPDATE here.
REVOKE INSERT, UPDATE ON alumni_v2.conversations FROM authenticated;

-- 3. Participants -----------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated can view participants" ON alumni_v2.conversation_participants;
DROP POLICY IF EXISTS "Users can update own read status" ON alumni_v2.conversation_participants;

-- You can see the participants of conversations you belong to (including the
-- other person's row), but nothing else.
CREATE POLICY "Users can view participants of own conversations" ON alumni_v2.conversation_participants
  FOR SELECT USING (alumni_v2.is_conversation_participant(conversation_id));

-- Only your own row, and only in place: the WITH CHECK (plus the helper) stops
-- a user from moving their participant row into someone else's conversation.
CREATE POLICY "Users can update own read status" ON alumni_v2.conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND alumni_v2.is_conversation_participant(conversation_id)
  );

-- Inserts are handled exclusively by create_conversation().
REVOKE INSERT ON alumni_v2.conversation_participants FROM authenticated;

-- 4. Messages ---------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated can view messages" ON alumni_v2.messages;
DROP POLICY IF EXISTS "Authenticated can send messages" ON alumni_v2.messages;

CREATE POLICY "Users can view messages in own conversations" ON alumni_v2.messages
  FOR SELECT USING (alumni_v2.is_conversation_participant(conversation_id));

CREATE POLICY "Users can send messages to own conversations" ON alumni_v2.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND alumni_v2.is_conversation_participant(conversation_id)
  );

-- 5. Remove anonymous access entirely --------------------------------------

REVOKE ALL ON alumni_v2.conversations FROM anon;
REVOKE ALL ON alumni_v2.conversation_participants FROM anon;
REVOKE ALL ON alumni_v2.messages FROM anon;

-- Make the policy/function changes visible to PostgREST immediately.
NOTIFY pgrst, 'reload schema';
