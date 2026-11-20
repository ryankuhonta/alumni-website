'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ConversationWithDetails } from '@/types/messaging'
import BatchAvatar from '@/components/messages/BatchAvatar'

export default function InboxList() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations')
      const data = await res.json()
      if (data.error) {
        console.error('Conversations API error:', data.error)
      }
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading conversations...</div>
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No conversations yet</p>
        <p className="text-sm text-gray-400">
          Start a conversation by visiting an alumni&apos;s profile and clicking &quot;Message&quot;
        </p>
      </div>
    )
  }

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
