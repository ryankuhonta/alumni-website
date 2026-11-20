-- Migration 028: Enable batch groups
--
-- Phase 2 of two. Run ONLY after the batch-chat code is deployed: this
-- migration creates the batch conversations, and the previous inbox code
-- cannot render them.
--
-- Creates one conversation per batch, adds every existing batchmate as a
-- participant, and keeps membership in sync for future registrations.

-- 1. Membership sync -------------------------------------------------------

CREATE OR REPLACE FUNCTION alumni_v2.sync_batch_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = alumni_v2, pg_temp
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Remove from the previous batch when a batch year changes.
  IF TG_OP = 'UPDATE' AND OLD.batch_year IS DISTINCT FROM NEW.batch_year THEN
    DELETE FROM alumni_v2.conversation_participants cp
    USING alumni_v2.conversations c
    WHERE cp.conversation_id = c.id
      AND cp.user_id = NEW.id
      AND c.type = 'batch'
      AND c.batch_year = OLD.batch_year;
  END IF;

  -- Teachers (batch_year = 0) have no batch group.
  IF NEW.batch_year IS NULL OR NEW.batch_year <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO alumni_v2.conversations (type, batch_year)
  VALUES ('batch', NEW.batch_year)
  ON CONFLICT (batch_year) WHERE type = 'batch' DO NOTHING;

  SELECT c.id INTO v_conversation_id
  FROM alumni_v2.conversations c
  WHERE c.type = 'batch'
    AND c.batch_year = NEW.batch_year;

  INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, NEW.id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_sync_batch_membership ON alumni_v2.users;

CREATE TRIGGER users_sync_batch_membership
  AFTER INSERT OR UPDATE OF batch_year ON alumni_v2.users
  FOR EACH ROW
  EXECUTE FUNCTION alumni_v2.sync_batch_membership();

-- 2. Backfill --------------------------------------------------------------

INSERT INTO alumni_v2.conversations (type, batch_year)
SELECT 'batch', u.batch_year
FROM alumni_v2.users u
WHERE u.batch_year > 0
GROUP BY u.batch_year
ON CONFLICT (batch_year) WHERE type = 'batch' DO NOTHING;

INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
SELECT c.id, u.id
FROM alumni_v2.users u
JOIN alumni_v2.conversations c
  ON c.type = 'batch'
 AND c.batch_year = u.batch_year
WHERE u.batch_year > 0
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- 3. Refresh planner statistics -------------------------------------------

ANALYZE alumni_v2.conversations;
ANALYZE alumni_v2.conversation_participants;

NOTIFY pgrst, 'reload schema';
