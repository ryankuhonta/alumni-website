# Batch Group Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every alumni batch one automatic group conversation, pinned at the top of the existing Messages inbox, with full history, sender names and unread counts.

**Architecture:** Reuse `conversations`, `conversation_participants` and `messages`. Add `type` and `batch_year` to `conversations`, keep members in sync with a `SECURITY DEFINER` trigger on `users`, and return the richer inbox shape from a rewritten `get_conversations` RPC plus a new `get_conversation` RPC.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19, TypeScript, Tailwind 4, Supabase (`alumni_v2` schema, `@supabase/ssr`), Postgres migrations.

**Spec:** `docs/superpowers/specs/2026-11-20-batch-group-chat-design.md`

## Global Constraints

- Schema is `alumni_v2`; the Supabase clients already set `db.schema = 'alumni_v2'`, so never schema-qualify inside supabase-js calls.
- Do **not** apply migrations with the CLI; the human runs them in the Supabase SQL Editor. Ask, then wait.
- Two-phase rollout: `027` is applied **before** the code deploy; `028` is applied **after** the deploy reports success. Never run `028` early.
- There is no automated test framework. "Tests" in this plan mean: `npx tsc --noEmit`, `npx eslint <changed files>`, `npm run build`, SQL assertions, and the manual checklist. Do not add a test framework.
- Lint baseline already has unrelated errors (react-hooks/set-state-in-effect, no-explicit-any). Only the changed files must be clean.
- RLS is participant-based (migration 026). All new `SECURITY DEFINER` functions must filter by `auth.uid()` and be `REVOKE`d from `PUBLIC`/`anon`.
- Keep English copy in the UI, matching the rest of the app.
- Commit style: conventional commits, one commit per task.
- Commit and push to `master` (this repo deploys from `master`).

---

### Task 1: Migration 027 — schema and RPCs (no batch rows yet)

**Files:**
- Create: `supabase/migrations/027_batch_group_chat.sql`

**Interfaces:**
- Consumes: `alumni_v2.is_conversation_participant(uuid)` from migration 026.
- Produces: `get_conversations()` with columns `id, created_at, updated_at, conversation_type, batch_year, title, member_count, other_user_id, other_first_name, other_last_name, other_profile_picture, last_message_content, last_message_created_at, last_message_sender_id, last_message_sender_first_name, last_message_is_own, unread_count`; `get_conversation(uuid)` with `id, conversation_type, batch_year, title, member_count, other_user_id, other_first_name, other_last_name, other_profile_picture, viewer_id`.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/027_batch_group_chat.sql` with exactly:

```sql
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
```

- [ ] **Step 2: Ask the human to run it**

Give them: `https://supabase.com/dashboard/project/nkjomnnyblwpezcsepgb/sql/new`, the full file contents, and ask for the result. Expected: `Success. No rows returned`. Wait before continuing.

- [ ] **Step 3: Verify the phase-1 state with SQL**

Ask the human to run and report:

```sql
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'alumni_v2'
  and p.proname in ('get_conversations', 'get_conversation', 'create_conversation')
order by p.proname;

select count(*) as batch_rows from alumni_v2.conversations where type = 'batch';
select count(*) as direct_rows from alumni_v2.conversations where type = 'direct';
```

Expected: three function names; `batch_rows = 0`; `direct_rows` equals the pre-migration DM count.

- [ ] **Step 4: Ask the human to smoke-test the live inbox**

The old app must still load Messages after 027. Ask them to open `/messages` and confirm the list appears. Do not deploy yet if it fails.

- [ ] **Step 5: Commit the migration**

```bash
git add supabase/migrations/027_batch_group_chat.sql
git commit -m "feat: add batch group chat schema and RPCs"
```

---

### Task 2: Types and messaging API library

**Files:**
- Modify: `types/messaging.ts`
- Modify: `lib/api/messages.ts`

**Interfaces:**
- Consumes: RPC shapes from Task 1.
- Produces:
  - `getConversationDetails(conversationId: string): Promise<ConversationDetails | null>`
  - `getMessages(conversationId: string, viewerId: string, options?: { before?: string | null; limit?: number }): Promise<{ messages: MessageWithSender[]; hasMore: boolean }>`
  - `ConversationWithDetails` now has `type`, `batchYear`, `title`, `memberCount`, nullable `otherUser`, and `lastMessage.isOwn` / `lastMessage.senderFirstName`.

- [ ] **Step 1: Replace `types/messaging.ts` with**

```ts
export interface Conversation {
  id: string
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  last_read_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface ConversationUser {
  id: string
  first_name: string
  last_name: string
  profile_picture: string | null
}

export interface ConversationWithDetails {
  id: string
  created_at: string
  updated_at: string
  type: 'direct' | 'batch'
  batchYear: number | null
  title: string | null
  memberCount: number | null
  otherUser: ConversationUser | null
  lastMessage: {
    content: string
    created_at: string
    sender_id: string
    senderFirstName: string | null
    isOwn: boolean
  } | null
  unreadCount: number
}

export interface ConversationDetails {
  id: string
  type: 'direct' | 'batch'
  batchYear: number | null
  title: string | null
  memberCount: number | null
  otherUser: ConversationUser | null
  viewerId: string
}

export interface MessageWithSender {
  id: string
  sender_id: string
  content: string
  created_at: string
  isOwn: boolean
  sender: {
    first_name: string
    last_name: string
    profile_picture: string | null
  }
}
```

- [ ] **Step 2: Update the row types and mappers in `lib/api/messages.ts`**

Replace the interface/helper block near the top with:

```ts
interface ConversationRow {
  id: string
  created_at: string
  updated_at: string
  conversation_type: 'direct' | 'batch'
  batch_year: number | null
  title: string | null
  member_count: number | string | null
  other_user_id: string | null
  other_first_name: string | null
  other_last_name: string | null
  other_profile_picture: string | null
  last_message_content: string | null
  last_message_created_at: string | null
  last_message_sender_id: string | null
  last_message_sender_first_name: string | null
  last_message_is_own: boolean | null
  unread_count: number | string | null
}

interface ConversationDetailsRow {
  id: string
  conversation_type: 'direct' | 'batch'
  batch_year: number | null
  title: string | null
  member_count: number | string | null
  other_user_id: string | null
  other_first_name: string | null
  other_last_name: string | null
  other_profile_picture: string | null
  viewer_id: string
}

interface SenderRow {
  first_name: string
  last_name: string
  profile_picture: string | null
}

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender: SenderRow | SenderRow[] | null
}

const MESSAGE_COLUMNS =
  'id, conversation_id, sender_id, content, created_at, sender:users(first_name, last_name, profile_picture)'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

function mapOtherUser(row: {
  other_user_id: string | null
  other_first_name: string | null
  other_last_name: string | null
  other_profile_picture: string | null
}): ConversationUser | null {
  if (!row.other_user_id) return null

  return {
    id: row.other_user_id,
    first_name: row.other_first_name ?? '',
    last_name: row.other_last_name ?? '',
    profile_picture: row.other_profile_picture,
  }
}

function mapMessageRow(row: MessageRow, currentUserId: string): MessageWithSender {
  const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender

  return {
    id: row.id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
    isOwn: row.sender_id === currentUserId,
    sender: sender || { first_name: 'Unknown', last_name: '', profile_picture: null },
  }
}
```

Update the import line to include `ConversationDetails, ConversationUser`:

```ts
import { ConversationWithDetails, ConversationDetails, ConversationUser, MessageWithSender } from '@/types/messaging'
```

- [ ] **Step 3: Replace `getConversations()` mapping**

```ts
export async function getConversations(): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('get_conversations')

  if (error) {
    console.error('get_conversations error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to get conversations')
  }

  return ((data ?? []) as ConversationRow[]).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    type: row.conversation_type,
    batchYear: row.batch_year,
    title: row.title,
    memberCount: row.member_count === null || row.member_count === undefined ? null : Number(row.member_count),
    otherUser: mapOtherUser(row),
    lastMessage: row.last_message_created_at
      ? {
          content: row.last_message_content ?? '',
          created_at: row.last_message_created_at,
          sender_id: row.last_message_sender_id ?? '',
          senderFirstName: row.last_message_sender_first_name,
          isOwn: Boolean(row.last_message_is_own),
        }
      : null,
    unreadCount: Number(row.unread_count ?? 0),
  }))
}
```

- [ ] **Step 4: Add `getConversationDetails()` right after `getConversations()`**

```ts
export async function getConversationDetails(conversationId: string): Promise<ConversationDetails | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_conversation', { p_conversation_id: conversationId })

  if (error) {
    console.error('get_conversation error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to get conversation')
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConversationDetailsRow | undefined
  if (!row) return null

  return {
    id: row.id,
    type: row.conversation_type,
    batchYear: row.batch_year,
    title: row.title,
    memberCount: row.member_count === null || row.member_count === undefined ? null : Number(row.member_count),
    otherUser: mapOtherUser(row),
    viewerId: row.viewer_id,
  }
}
```

- [ ] **Step 5: Update `getMessages()` signature and body**

```ts
export async function getMessages(
  conversationId: string,
  viewerId: string,
  options?: { before?: string | null; limit?: number }
): Promise<{ messages: MessageWithSender[]; hasMore: boolean }> {
  const supabase = await createClient()
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)

  let query = supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  const { data, error } = await query

  if (error) {
    console.error('getMessages error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to get messages')
  }

  const rows = (data ?? []) as MessageRow[]
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  return {
    messages: page.reverse().map((row) => mapMessageRow(row, viewerId)),
    hasMore,
  }
}
```

RLS on `messages` enforces participation, so there is no separate participant query.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npx eslint lib/api/messages.ts types/messaging.ts
```

Expected: both clean. `tsc` will fail until Task 3 updates the route's `getMessages` call; that is expected. If it fails only in `app/api/messages/[conversationId]/route.ts`, continue to Task 3.

- [ ] **Step 7: Commit**

```bash
git add types/messaging.ts lib/api/messages.ts
git commit -m "feat: map batch conversations in messaging API"
```

---

### Task 3: Thread API route

**Files:**
- Modify: `app/api/messages/[conversationId]/route.ts`

**Interfaces:**
- Consumes: `getConversationDetails`, `getMessages` from Task 2.
- Produces: `GET /api/messages/:id` returning `{ conversation, messages, hasMore }`, `404` when the caller is not a participant.

- [ ] **Step 1: Replace the route with**

```ts
import { NextResponse } from 'next/server'
import { getConversationDetails, getMessages } from '@/lib/api/messages'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const conversation = await getConversationDetails(conversationId)

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const before = searchParams.get('before')
    const limitParam = Number(searchParams.get('limit'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined

    const { messages, hasMore } = await getMessages(conversationId, conversation.viewerId, { before, limit })

    return NextResponse.json({ conversation, messages, hasMore })
  } catch (error) {
    console.error('GET MESSAGES ERROR:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npx eslint "app/api/messages/[conversationId]/route.ts"
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "app/api/messages/[conversationId]/route.ts"
git commit -m "feat: return conversation details with thread messages"
```

---

### Task 4: Batch avatar and inbox rendering

**Files:**
- Create: `components/messages/BatchAvatar.tsx`
- Modify: `components/messages/InboxList.tsx`

**Interfaces:**
- Produces: `<BatchAvatar year={number} size?={number} />`, used by the inbox and the thread header.
- Consumes: `ConversationWithDetails` from Task 2.

- [ ] **Step 1: Create `components/messages/BatchAvatar.tsx`**

```tsx
export default function BatchAvatar({ year, size = 44 }: { year: number; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--primary-color)',
        fontSize: size <= 38 ? 11 : 14,
      }}
      aria-hidden="true"
    >
      {year}
    </div>
  )
}
```

- [ ] **Step 2: Replace the list body in `components/messages/InboxList.tsx`**

Add the import:

```tsx
import BatchAvatar from '@/components/messages/BatchAvatar'
```

Replace the `return (...)` block after the empty-state check with:

```tsx
  return (
    <div className="divide-y">
      {conversations.map((conv) => {
        const isBatch = conv.type === 'batch'
        const otherUser = conv.otherUser
        const name = isBatch
          ? conv.title ?? 'Batch'
          : otherUser
            ? `${otherUser.first_name} ${otherUser.last_name}`
            : 'Conversation'

        const previewPrefix = conv.lastMessage
          ? conv.lastMessage.isOwn
            ? 'You'
            : isBatch
              ? conv.lastMessage.senderFirstName ?? 'Someone'
              : null
          : null

        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
          >
            {isBatch ? (
              <BatchAvatar year={conv.batchYear ?? 0} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {otherUser?.profile_picture ? (
                  <img
                    src={otherUser.profile_picture}
                    alt={`${otherUser.first_name} ${otherUser.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-400">
                    {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold truncate">{name}</h3>
                {isBatch && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
                    Pinned
                  </span>
                )}
                {conv.lastMessage && (
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 truncate">
                {conv.lastMessage
                  ? `${previewPrefix ? `${previewPrefix}: ` : ''}${conv.lastMessage.content}`
                  : isBatch
                    ? 'No messages yet'
                    : ''}
              </p>
            </div>

            {conv.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {conv.unreadCount}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npx eslint components/messages/InboxList.tsx components/messages/BatchAvatar.tsx
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/messages/BatchAvatar.tsx components/messages/InboxList.tsx
git commit -m "feat: show batch conversations in the inbox"
```

---

### Task 5: Thread header, sender names, and server-side auth

**Files:**
- Modify: `components/messages/ChatThread.tsx`
- Modify: `components/messages/ConversationView.tsx`
- Modify: `app/messages/[id]/page.tsx`

**Interfaces:**
- Consumes: the `{ conversation, messages, hasMore }` response from Task 3; `BatchAvatar` from Task 4.
- Produces: thread UI with batch header (`Batch 2005`, `42 members`) and sender names on incoming batch messages.

- [ ] **Step 1: Replace `app/messages/[id]/page.tsx` with**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConversationView from '@/components/messages/ConversationView'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <ConversationView id={id} />
}
```

- [ ] **Step 2: Replace `components/messages/ConversationView.tsx` with**

```tsx
import ChatThread from '@/components/messages/ChatThread'

export default function ConversationView({ id }: { id: string }) {
  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white border rounded-lg h-[calc(100vh-200px)] flex flex-col">
          <ChatThread conversationId={id} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace `components/messages/ChatThread.tsx` with**

```tsx
'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ConversationDetails, MessageWithSender } from '@/types/messaging'
import MessageInput from '@/components/messages/MessageInput'
import BatchAvatar from '@/components/messages/BatchAvatar'

const PAGE_SIZE = 50

interface ChatThreadProps {
  conversationId: string
}

interface ScrollIntent {
  mode: 'bottom' | 'preserve'
  smooth?: boolean
  prevHeight?: number
  prevTop?: number
}

export default function ChatThread({ conversationId }: ChatThreadProps) {
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollIntent = useRef<ScrollIntent>({ mode: 'bottom' })

  const markAsRead = useCallback(async () => {
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [conversationId])

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}?limit=${PAGE_SIZE}`)

      if (res.status === 404) {
        setNotFound(true)
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      scrollIntent.current = { mode: 'bottom' }
      setConversation(data.conversation)
      setMessages(data.messages || [])
      setHasMore(Boolean(data.hasMore))
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  const loadOlder = useCallback(async () => {
    const oldest = messages[0]
    if (!oldest || loadingOlder) return

    const el = scrollRef.current
    const prevHeight = el?.scrollHeight ?? 0
    const prevTop = el?.scrollTop ?? 0

    setLoadingOlder(true)
    try {
      const res = await fetch(
        `/api/messages/${conversationId}?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldest.created_at)}`
      )

      if (res.status === 404) {
        setNotFound(true)
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      scrollIntent.current = { mode: 'preserve', prevHeight, prevTop }
      setMessages((prev) => [...(data.messages || []), ...prev])
      setHasMore(Boolean(data.hasMore))
    } catch (error) {
      console.error('Failed to load older messages:', error)
    } finally {
      setLoadingOlder(false)
    }
  }, [conversationId, messages, loadingOlder])

  const handleMessageSent = useCallback((message: MessageWithSender) => {
    scrollIntent.current = { mode: 'bottom', smooth: true }
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
  }, [])

  useEffect(() => {
    fetchLatest()
    markAsRead()
  }, [fetchLatest, markAsRead])

  useLayoutEffect(() => {
    const intent = scrollIntent.current
    const el = scrollRef.current

    if (intent.mode === 'preserve' && el) {
      el.scrollTop = el.scrollHeight - (intent.prevHeight ?? 0) + (intent.prevTop ?? 0)
      return
    }

    bottomRef.current?.scrollIntoView({ behavior: intent.smooth ? 'smooth' : 'auto' })
  }, [messages])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading messages...</div>
  }

  if (notFound || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
        Conversation not found or you don&apos;t have access.
      </div>
    )
  }

  const isBatch = conversation.type === 'batch'
  const otherUser = conversation.otherUser
  const headerTitle = isBatch
    ? conversation.title ?? 'Batch'
    : otherUser
      ? `${otherUser.first_name} ${otherUser.last_name}`
      : 'Conversation'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Link href="/messages" aria-label="Back to messages" className="text-2xl leading-none text-gray-500 hover:text-gray-700">
          ‹
        </Link>

        {isBatch ? (
          <BatchAvatar year={conversation.batchYear ?? 0} size={38} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {otherUser?.profile_picture ? (
              <img
                src={otherUser.profile_picture}
                alt={`${otherUser.first_name} ${otherUser.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-gray-400">
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </span>
            )}
          </div>
        )}

        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{headerTitle}</p>
          <p className="text-xs text-gray-500">
            {isBatch ? `${conversation.memberCount ?? 0} members` : 'Direct message'}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-center">
            {isBatch ? 'No messages yet. Say hi to your batch!' : 'No messages yet. Send the first message!'}
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  {loadingOlder ? 'Loading older messages...' : 'Load older messages'}
                </button>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${msg.isOwn ? 'flex flex-col items-end' : ''}`}>
                  {isBatch && !msg.isOwn && (
                    <p className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                      {msg.sender.first_name} {msg.sender.last_name}
                    </p>
                  )}

                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.isOwn
                        ? 'text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                    style={msg.isOwn ? { backgroundColor: 'var(--primary-color)' } : undefined}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageInput conversationId={conversationId} onMessageSent={handleMessageSent} />
    </div>
  )
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npx eslint components/messages/ChatThread.tsx components/messages/ConversationView.tsx "app/messages/[id]/page.tsx"
```

Expected: `tsc` clean. ESLint may report the pre-existing `react-hooks/set-state-in-effect` on `fetchLatest()`; that rule already fired in the old ChatThread and across the repo, so it is not a regression. No new rule violations.

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: success (37 routes).

- [ ] **Step 6: Commit**

```bash
git add components/messages/ChatThread.tsx components/messages/ConversationView.tsx "app/messages/[id]/page.tsx"
git commit -m "feat: add batch thread header and sender names"
```

---

### Task 6: Deploy phase 1

**Files:** none.

- [ ] **Step 1: Push**

```bash
git push origin master
```

- [ ] **Step 2: Wait for the Vercel deployment**

```powershell
for ($i = 0; $i -lt 24; $i++) {
  $s = Invoke-RestMethod -Uri "https://api.github.com/repos/ryankuhonta/alumni-website/commits/<HEAD_SHA>/status" -Headers @{ "User-Agent" = "opencode" }
  Write-Output ("{0} {1}" -f $i, $s.state)
  if ($s.state -ne "pending") { break }
  Start-Sleep -Seconds 10
}
```

Expected: `success`. Replace `<HEAD_SHA>` with `git rev-parse --short HEAD`.

- [ ] **Step 3: Verify the live bundle contains the new thread UI**

```js
const base = "https://www.liceodesanpedroalumni.org";
const res = await fetch(`${base}/messages/00000000-0000-0000-0000-000000000000`);
const html = await res.text();
const scripts = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map(m => m[0]))];
let found = null;
for (const s of scripts) {
  const js = await (await fetch(base + s)).text();
  if (js.includes("members") && js.includes("Load older messages")) { found = s; break; }
}
return { found };
```

Expected: a chunk path (not `null`).

- [ ] **Step 4: Confirm the region is still Sydney**

```js
const r = await fetch("https://www.liceodesanpedroalumni.org/api/messages/unread-count");
return { region: r.headers.get("x-vercel-id"), status: r.status };
```

Expected: `sin1::syd1::…`, status 200.

---

### Task 7: Migration 028 — backfill and membership trigger

**Precondition:** Task 6 reported deployment success. Never run this before the new code is live.

**Files:**
- Create: `supabase/migrations/028_enable_batch_groups.sql`

**Interfaces:**
- Consumes: `type` / `batch_year` from Task 1.
- Produces: one batch conversation per `batch_year > 0`, all matching users as participants, and the `users_sync_batch_membership` trigger.

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Ask the human to run it**

Same SQL Editor URL. Expected: `Success. No rows returned`. Wait for confirmation.

- [ ] **Step 3: Ask the human to run the assertions**

```sql
-- Must return no rows (no duplicate batch conversation for a year)
select batch_year, count(*)
from alumni_v2.conversations
where type = 'batch'
group by batch_year
having count(*) > 1;

-- Must return 0 (every batchmate is a participant)
select count(*) as missing_members
from alumni_v2.users u
where u.batch_year > 0
  and not exists (
    select 1
    from alumni_v2.conversation_participants cp
    join alumni_v2.conversations c on c.id = cp.conversation_id
    where cp.user_id = u.id
      and c.type = 'batch'
      and c.batch_year = u.batch_year
  );

-- For comparison with the value recorded in Task 1
select count(*) as direct_rows
from alumni_v2.conversations
where type = 'direct';
```

Expected: empty; `missing_members = 0`; `direct_rows` unchanged.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/028_enable_batch_groups.sql
git commit -m "feat: backfill batch groups and sync membership"
```

---

### Task 8: End-to-end verification

**Files:** none.

- [ ] **Step 1: Verify anonymous access is still denied**

Use the public anon key from the site bundle, then:

```js
const checks = [
  "conversations?select=id&limit=1",
  "conversation_participants?select=conversation_id&limit=1",
  "messages?select=id&limit=1",
];
// Expect 401 permission denied for each.

const rpcChecks = ["get_conversation", "get_conversations", "get_unread_message_count"];
// Expect 401 permission denied for each.
```

For `get_conversation`, POST `{"p_conversation_id":"00000000-0000-0000-0000-000000000000"}`.

- [ ] **Step 2: Ask the human to run the manual checklist**

| Check | Expected |
|---|---|
| `/messages` | pinned `Batch <year>` at the top, `2005` avatar, correct preview |
| Open batch thread | header `Batch <year>` + `N members`, full history |
| Send in batch | appears immediately, no reload |
| Load older in a long thread | prepends without jumping |
| DM a batchmate | opens a **direct** thread with only the two of you; batch group untouched |
| Existing DM threads | still work; unread badges unchanged |
| Another batch's conversation URL | “Conversation not found or you don't have access.” |
| New registration in an existing batch | appears as a member of that batch group |

- [ ] **Step 3: Report**

Report the checklist result, the SQL assertion numbers, and any console errors from the thread. Do not claim success without them.
