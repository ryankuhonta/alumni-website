-- Migration 027: Batch group chat — schema and RPCs
--
-- Phase 1 of two. This migration only adds columns and replaces functions.
-- It creates NO batch conversations, so the currently deployed app keeps
-- working (every conversation is still type='direct').
--
-- Phase 2 (028_enable_batch_groups.sql) runs after the new code is deployed.

-- 1. Schema ----------------------------------------------------------------

ALTER TABLE alumni_v2.conversations
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS batch_year integer;

ALTER TABLE alumni_v2.conversations
  DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE alumni_v2.conversations
  ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('direct', 'batch'));

ALTER TABLE alumni_v2.conversations
  DROP CONSTRAINT IF EXISTS conversations_batch_year_check;
ALTER TABLE alumni_v2.conversations
  ADD CONSTRAINT conversations_batch_year_check
  CHECK ((type = 'batch') = (batch_year IS NOT NULL));

CREATE UNIQUE INDEX IF NOT EXISTS conversations_one_per_batch
  ON alumni_v2.conversations (batch_year)
  WHERE type = 'batch';

-- 2. Direct-message lookup must ignore batch conversations -----------------

CREATE OR REPLACE FUNCTION alumni_v2.create_conversation(p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = alumni_v2, pg_temp
AS $$
DECLARE
  v_conversation_id UUID;
  v_sender_id UUID;
BEGIN
  v_sender_id := auth.uid();

  IF v_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot message yourself';
  END IF;

  SELECT cp1.conversation_id INTO v_conversation_id
  FROM alumni_v2.conversation_participants cp1
  JOIN alumni_v2.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  JOIN alumni_v2.conversations c
    ON c.id = cp1.conversation_id
   AND c.type = 'direct'
  WHERE cp1.user_id = v_sender_id
    AND cp2.user_id = p_recipient_id
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO alumni_v2.conversations DEFAULT VALUES
  RETURNING id INTO v_conversation_id;

  INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_sender_id),
         (v_conversation_id, p_recipient_id);

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION alumni_v2.create_conversation(UUID) TO authenticated;

-- 3. Inbox RPC -------------------------------------------------------------

DROP FUNCTION IF EXISTS alumni_v2.get_conversations();

CREATE FUNCTION alumni_v2.get_conversations()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  conversation_type text,
  batch_year integer,
  title text,
  member_count bigint,
  other_user_id uuid,
  other_first_name text,
  other_last_name text,
  other_profile_picture text,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  last_message_sender_first_name text,
  last_message_is_own boolean,
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
    c.type,
    c.batch_year,
    CASE WHEN c.type = 'batch' THEN 'Batch ' || c.batch_year::text END,
    mc.total,
    other_user.id,
    other_user.first_name,
    other_user.last_name,
    other_user.profile_picture,
    last_message.content,
    last_message.created_at,
    last_message.sender_id,
    last_message.sender_first_name,
    last_message.sender_id = auth.uid(),
    COALESCE(unread.total, 0)::bigint
  FROM alumni_v2.conversation_participants me
  JOIN alumni_v2.conversations c
    ON c.id = me.conversation_id
  LEFT JOIN LATERAL (
    SELECT u.id, u.first_name, u.last_name, u.profile_picture
    FROM alumni_v2.conversation_participants other
    JOIN alumni_v2.users u ON u.id = other.user_id
    WHERE other.conversation_id = c.id
      AND other.user_id <> me.user_id
    LIMIT 1
  ) other_user ON c.type = 'direct'
  LEFT JOIN LATERAL (
    SELECT m.content, m.created_at, m.sender_id, su.first_name AS sender_first_name
    FROM alumni_v2.messages m
    LEFT JOIN alumni_v2.users su ON su.id = m.sender_id
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) last_message ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS total
    FROM alumni_v2.conversation_participants p
    WHERE p.conversation_id = c.id
  ) mc ON c.type = 'batch'
  LEFT JOIN LATERAL (
    SELECT count(*) AS total
    FROM alumni_v2.messages m
    WHERE m.conversation_id = c.id
      AND m.sender_id <> me.user_id
      AND m.created_at > me.last_read_at
  ) unread ON true
  WHERE me.user_id = auth.uid()
    AND (c.type = 'batch' OR last_message.sender_id IS NOT NULL)
  ORDER BY (c.type = 'batch') DESC, c.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION alumni_v2.get_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION alumni_v2.get_conversations() TO authenticated;

-- 4. Thread details RPC ----------------------------------------------------

DROP FUNCTION IF EXISTS alumni_v2.get_conversation(uuid);

CREATE FUNCTION alumni_v2.get_conversation(p_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  conversation_type text,
  batch_year integer,
  title text,
  member_count bigint,
  other_user_id uuid,
  other_first_name text,
  other_last_name text,
  other_profile_picture text,
  viewer_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = alumni_v2, pg_temp
AS $$
  SELECT
    c.id,
    c.type,
    c.batch_year,
    CASE WHEN c.type = 'batch' THEN 'Batch ' || c.batch_year::text END,
    mc.total,
    other_user.id,
    other_user.first_name,
    other_user.last_name,
    other_user.profile_picture,
    auth.uid()
  FROM alumni_v2.conversations c
  LEFT JOIN LATERAL (
    SELECT u.id, u.first_name, u.last_name, u.profile_picture
    FROM alumni_v2.conversation_participants op
    JOIN alumni_v2.users u ON u.id = op.user_id
    WHERE op.conversation_id = c.id
      AND op.user_id <> auth.uid()
    LIMIT 1
  ) other_user ON c.type = 'direct'
  LEFT JOIN LATERAL (
    SELECT count(*) AS total
    FROM alumni_v2.conversation_participants p
    WHERE p.conversation_id = c.id
  ) mc ON c.type = 'batch'
  WHERE c.id = p_conversation_id
    AND alumni_v2.is_conversation_participant(c.id);
$$;

REVOKE ALL ON FUNCTION alumni_v2.get_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION alumni_v2.get_conversation(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
