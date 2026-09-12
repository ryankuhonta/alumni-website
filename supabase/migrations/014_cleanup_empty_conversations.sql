-- Clean up empty conversations (no messages)
DELETE FROM alumni_v2.conversation_participants
WHERE conversation_id IN (
  SELECT c.id FROM alumni_v2.conversations c
  LEFT JOIN alumni_v2.messages m ON m.conversation_id = c.id
  WHERE m.id IS NULL
);

DELETE FROM alumni_v2.conversations
WHERE id IN (
  SELECT c.id FROM alumni_v2.conversations c
  LEFT JOIN alumni_v2.messages m ON m.conversation_id = c.id
  WHERE m.id IS NULL
);
