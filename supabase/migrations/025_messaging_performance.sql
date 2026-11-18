-- Migration 025: Messaging performance
--
-- Why: the messaging API used to fan out into 3 + 5N queries for the inbox and
-- 2 + N queries for the unread badge. With the Supabase project in Sydney and
-- the Vercel functions in US East, every round trip cost 200-400ms.
--
-- This migration:
--   1. Adds composite indexes for "latest message in conversation" and
--      "messages since my last_read_at".
--   2. Keeps conversations.updated_at in sync from the database, so the app no
--      longer needs a second UPDATE after every send.
--   3. Adds two SECURITY DEFINER RPCs that return the inbox and unread count in
--      a single query. They filter by auth.uid() explicitly because DEFINER
--      bypasses RLS.

-- 1. Indexes ---------------------------------------------------------------

-- Last message per conversation + thread pagination.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON alumni_v2.messages (conversation_id, created_at DESC);

-- Unread count per conversation (sender_id is only filtered, not ordered).
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_created_at
  ON alumni_v2.messages (conversation_id, sender_id, created_at);

-- 2. Keep conversations.updated_at in sync --------------------------------

CREATE OR REPLACE FUNCTION alumni_v2.touch_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = alumni_v2, pg_temp
AS $$
BEGIN
  UPDATE alumni_v2.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_touch_conversation ON alumni_v2.messages;

CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON alumni_v2.messages
  FOR EACH ROW
  EXECUTE FUNCTION alumni_v2.touch_conversation_on_message();

-- Backfill ordering for existing rows (only move forward, never backward).
UPDATE alumni_v2.conversations c
SET updated_at = latest.max_created_at
FROM (
  SELECT conversation_id, MAX(created_at) AS max_created_at
  FROM alumni_v2.messages
  GROUP BY conversation_id
) latest
WHERE c.id = latest.conversation_id
  AND latest.max_created_at > c.updated_at;

-- 3. Inbox RPC -------------------------------------------------------------

CREATE OR REPLACE FUNCTION alumni_v2.get_conversations()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  other_user_id uuid,
  other_first_name text,
  other_last_name text,
  other_profile_picture text,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = alumni_v2, pg_temp
AS $$
  SELECT
    c.id,
    c.created_at,
    c.updated_at,
    other_user.id,
    other_user.first_name,
    other_user.last_name,
    other_user.profile_picture,
    last_message.content,
    last_message.created_at,
    last_message.sender_id,
    COALESCE(unread.total, 0)::bigint
  FROM alumni_v2.conversation_participants me
  JOIN alumni_v2.conversations c
    ON c.id = me.conversation_id
  -- Conversations always have exactly two participants; skip malformed ones.
  JOIN LATERAL (
    SELECT u.id, u.first_name, u.last_name, u.profile_picture
    FROM alumni_v2.conversation_participants other
    JOIN alumni_v2.users u ON u.id = other.user_id
    WHERE other.conversation_id = me.conversation_id
      AND other.user_id <> me.user_id
    LIMIT 1
  ) other_user ON true
  -- Skip conversations that have no messages yet.
  JOIN LATERAL (
    SELECT m.content, m.created_at, m.sender_id
    FROM alumni_v2.messages m
    WHERE m.conversation_id = me.conversation_id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) last_message ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS total
    FROM alumni_v2.messages m
    WHERE m.conversation_id = me.conversation_id
      AND m.sender_id <> me.user_id
      AND m.created_at > me.last_read_at
  ) unread ON true
  WHERE me.user_id = auth.uid()
  ORDER BY c.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION alumni_v2.get_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION alumni_v2.get_conversations() TO authenticated;

-- 4. Unread badge RPC ------------------------------------------------------

CREATE OR REPLACE FUNCTION alumni_v2.get_unread_message_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = alumni_v2, pg_temp
AS $$
  SELECT COALESCE(count(*), 0)::bigint
  FROM alumni_v2.conversation_participants me
  JOIN alumni_v2.messages m
    ON m.conversation_id = me.conversation_id
  WHERE me.user_id = auth.uid()
    AND m.sender_id <> me.user_id
    AND m.created_at > me.last_read_at;
$$;

REVOKE ALL ON FUNCTION alumni_v2.get_unread_message_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION alumni_v2.get_unread_message_count() TO authenticated;

-- 5. Refresh planner statistics -------------------------------------------

ANALYZE alumni_v2.messages;
ANALYZE alumni_v2.conversation_participants;
ANALYZE alumni_v2.conversations;

-- Make the new RPCs visible to PostgREST immediately.
NOTIFY pgrst, 'reload schema';
