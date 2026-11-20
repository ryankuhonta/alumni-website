# Batch Group Chat — Design

**Date:** 2026-11-20
**Status:** Awaiting review
**Scope:** Automatic group conversation per alumni batch, inside the existing messaging system

## Overview

Every alumni batch gets one group conversation, automatically. It appears pinned at the top of the existing Messages inbox. All batch members can read the full history and send messages. Direct (1:1) messaging keeps working exactly as it does today.

The feature reuses the existing `conversations`, `conversation_participants`, and `messages` tables. No second chat system is introduced.

## Decisions

| Question | Decision |
|---|---|
| Membership | Automatic — every user with that `batch_year` is a member, including future registrants |
| Who can post | All members |
| History for new members | Full history; `last_read_at` starts at `now()` so they get 0 unread |
| Where it appears | Same inbox, pinned above direct conversations |
| Batch avatar | Full batch year (e.g. `2005`) in a brand-blue circle |
| Teachers | Excluded (`batch_year = 0`); admins with a real batch year are members |
| Leaving / muting / moderation | Out of scope for v1 |

## Non-goals

- Real-time updates (existing app is manual-refresh)
- Attachments, reactions, replies, mentions
- Per-course or per-batch sub-groups
- Renaming a batch group
- Admin moderation of batch messages
- Leave / mute controls

## Data Model

Add two columns to `alumni_v2.conversations`:

| Column | Purpose |
|---|---|
| `type text NOT NULL DEFAULT 'direct'` | `'direct'` or `'batch'` |
| `batch_year integer NULL` | The batch this conversation represents; `NULL` for direct |

Constraints:

- `CHECK (type IN ('direct', 'batch'))`
- `CHECK ((type = 'batch') = (batch_year IS NOT NULL))` — batch has a year, direct does not
- `CREATE UNIQUE INDEX conversations_one_per_batch ON alumni_v2.conversations (batch_year) WHERE type = 'batch'`

Existing rows keep `type = 'direct'` automatically from the default.

`messages` and `conversation_participants` are unchanged. Group messengers are ordinary participant rows, so RLS, unread counts and read tracking keep working without special cases.

## Membership Sync

New `SECURITY DEFINER` function `alumni_v2.sync_batch_membership()`, called by an `AFTER INSERT OR UPDATE OF batch_year` trigger on `alumni_v2.users`:

1. If this is an update and `batch_year` changed, delete the user's participant row for the old batch conversation.
2. If `batch_year` is `NULL` or `<= 0`, stop (teachers).
3. Ensure the batch conversation exists:
   ```sql
   INSERT INTO alumni_v2.conversations (type, batch_year)
   VALUES ('batch', NEW.batch_year)
   ON CONFLICT (batch_year) WHERE type = 'batch' DO NOTHING;
   ```
4. Add the participant:
   ```sql
   INSERT INTO alumni_v2.conversation_participants (conversation_id, user_id)
   VALUES (v_conversation_id, NEW.id)
   ON CONFLICT (conversation_id, user_id) DO NOTHING;
   ```

`SECURITY DEFINER` is required because clients no longer hold INSERT grants on `conversations` or `conversation_participants` (migration 026).

Backfill (phase 2): create one conversation per distinct `batch_year > 0` in `users`, then insert a participant row for every user with that batch year.

## RPC Changes

### `create_conversation(p_recipient_id uuid)` — fix

Join `conversations` and require `c.type = 'direct'` in the existing-conversation lookup. Without this, two batchmates would get their batch group returned when trying to DM each other.

### `get_conversations()` — new shape

Because the return type changes, the migration must `DROP FUNCTION` before creating it, then re-apply grants (`REVOKE ... FROM PUBLIC, anon; GRANT ... TO authenticated`).

Returned columns:

| Column | Direct | Batch |
|---|---|---|
| `id`, `created_at`, `updated_at` | conversation | conversation |
| `conversation_type` | `direct` | `batch` |
| `batch_year` | `NULL` | year |
| `title` | `NULL` | `Batch <year>` |
| `member_count` | `NULL` | participant count |
| `other_user_id`, `other_first_name`, `other_last_name`, `other_profile_picture` | other person | `NULL` |
| `last_message_content`, `last_message_created_at`, `last_message_sender_id` | last message | last message |
| `last_message_sender_first_name` | for `You:` logic | preview name (`Rey: …`) |
| `last_message_is_own` | whether the viewer sent it | same |
| `unread_count` | unchanged | unchanged |

Join rules:

- `other_user` — `LEFT JOIN LATERAL`; required only for direct
- Direct rows whose counterpart participant no longer exists are skipped in `WHERE` (matching migration 025), so the inbox never returns a direct row with a null `otherUser`
- `last_message` — `LEFT JOIN LATERAL`; direct rows with no messages are still skipped in `WHERE`, batch rows are kept so an empty group is visible
- `member_count` — `LEFT JOIN LATERAL` aggregate, evaluated only for batch rows
- Order: `ORDER BY (c.type = 'batch') DESC, c.updated_at DESC`

### `get_conversation(p_conversation_id uuid)` — new

Returns the thread header metadata and performs the participant check:

| Column |
|---|
| `id`, `conversation_type`, `batch_year`, `title`, `member_count` |
| `other_user_id`, `other_first_name`, `other_last_name`, `other_profile_picture` |
| `viewer_id` (`auth.uid()`) — lets the messages query compute `isOwn` without a second auth call |

Returns no row when the caller is not a participant. Granted to `authenticated` only.

## API Changes

`GET /api/messages/[conversationId]?limit=&before=` — same pagination, richer response:

```json
{
  "conversation": {
    "id": "…",
    "type": "batch",
    "title": "Batch 2005",
    "memberCount": 42,
    "otherUser": null
  },
  "messages": [],
  "hasMore": true
}
```

- `getConversationDetails(id)` runs first; no row → `404 { error: "Conversation not found" }`
- `getMessages(conversationId, viewerId, options)` drops both its explicit participant check and its `auth.getUser()` call. It uses `viewerId` (from the details RPC) for `isOwn`; RLS on `messages` already denies non-participants. Net round trips per thread open: details RPC + messages query = **2**
- `send`, `read`, `unread-count` routes unchanged; batch messages count toward the existing badge
- `/api/messages/conversations` returns the new fields from the RPC

## UI

### Inbox (`components/messages/InboxList.tsx`)

| Element | Batch | Direct |
|---|---|---|
| Avatar | blue circle with `2005` | initials (unchanged) |
| Title | `Batch 2005` | other user's name |
| Sub-line | last message preview (`Rey: …` / `You: …`), or “No messages yet” | last message preview |
| Badge | unread count | unread count |
| Extra | `Pinned` pill | none |

Member count is shown in the thread header, not in the inbox row (matches the approved mockup).

Ordering comes from the RPC; no client-side sorting.

### Thread (`components/messages/ChatThread.tsx`)

- Header inside the chat card:
  - batch: back link to `/messages`, `2005` avatar, `Batch 2005`, `42 members`
  - direct: back link, other user's avatar and name
- Sender name above incoming bubbles **only for batch**; own messages never show a name
- Direct thread visuals otherwise unchanged
- Empty batch: “No messages yet. Say hi to your batch!”
- Existing “Load older messages”, scroll anchoring, and append-on-send are kept

### Authorization cleanup

- `app/messages/[id]/page.tsx` becomes a server component with `auth.getUser()` + `redirect('/login')`, matching `/messages`
- `ConversationView.tsx` loses its client-side auth/participant effect and loading state; the thread API is the single source of truth

## Security

- Messaging RLS stays participant-based (migration 026); no new tables means no new policy surface
- The membership trigger is `SECURITY DEFINER` with `SET search_path = alumni_v2, pg_temp`
- `get_conversations`, `get_conversation`, and `get_unread_message_count` are `SECURITY DEFINER` and filter by `auth.uid()`; anon is denied EXECUTE
- `create_conversation` is re-created with `REVOKE ALL ... FROM PUBLIC, anon` — `conversation_participants.user_id` is nullable, so an anon call could otherwise create participant rows with a `NULL` user
- Batch history is visible to batch members only; the details RPC returns nothing for non-participants

## Rollout

Two phases, so the live app never renders a batch row that the old inbox code cannot handle.

1. **`027_batch_group_chat.sql`** — columns, constraints, index, `create_conversation` fix, new `get_conversations` and `get_conversation`. No batch rows are created yet, so the live app keeps working
2. Deploy the new code; wait for the Vercel production deployment to report success
3. **`028_enable_batch_groups.sql`** — backfill batch conversations and participants, create the membership trigger, `ANALYZE`, `NOTIFY pgrst`
4. Verify with the checklist below

## Testing

| Layer | Check |
|---|---|
| DB | One batch conversation per year: `select batch_year, count(*) from conversations where type='batch' group by 1` |
| DB | No missing members: users with `batch_year > 0` without a participant row → **0** |
| DB | Direct conversation count unchanged from before the migration |
| App | Inbox shows pinned `Batch <year>`; member count matches DB |
| App | Batch thread loads history, sends, loads older |
| App | **Regression:** DM to a batchmate creates/opens a direct conversation, not the batch group |
| App | Existing direct threads and unread badges unchanged |
| App | New registrant of an existing batch appears as a member (checked with a test account) |
| Security | Account from another batch opening the batch conversation URL sees “Conversation not found” |
| Security | Anon key: tables, `get_conversation`, `get_conversations` → permission denied |
| Unread | Second account sends to the batch → badge increments; opening the thread clears it |

No automated test infrastructure exists in the repo (tracked in `BACKLOG.md`), so this is manual plus SQL assertions.

## Risks and Rollback

| Risk | Mitigation |
|---|---|
| Old inbox crashes on batch rows | Two-phase rollout — no batch rows until new code is live |
| `create_conversation` returns the batch group as a DM | Explicit `type = 'direct'` filter plus a regression test |
| Duplicate batch conversations | Partial unique index + `ON CONFLICT DO NOTHING` |
| Recursive trigger | Trigger only writes conversations/participants; no trigger on those tables |
| 1-member batch shows an empty group | Accepted; group is ready for future batchmates |
| Rollback before phase 2 | Revert the code; columns are inert |
| Rollback after phase 2 | Drop the trigger, delete batch conversations (cascades only batch messages) |

Rollback SQL (phase 2 only):

```sql
DROP TRIGGER IF EXISTS users_sync_batch_membership ON alumni_v2.users;
DELETE FROM alumni_v2.conversations WHERE type = 'batch';
```

## Files Touched

```
supabase/migrations/027_batch_group_chat.sql
supabase/migrations/028_enable_batch_groups.sql
lib/api/messages.ts
app/api/messages/[conversationId]/route.ts
types/messaging.ts
components/messages/InboxList.tsx
components/messages/ChatThread.tsx
components/messages/ConversationView.tsx
app/messages/[id]/page.tsx
```

## Future

- Admin moderation (delete message, lock thread)
- Leave / mute batch notifications
- Realtime updates
- Batch officer announcements (read-only channel)
