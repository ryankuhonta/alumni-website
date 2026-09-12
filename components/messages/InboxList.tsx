'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConversationWithDetails } from '@/types/messaging'

export default function InboxList() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

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
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/messages/${conv.id}`}
          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
        >
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {conv.otherUser.profile_picture ? (
              <img
                src={conv.otherUser.profile_picture}
                alt={`${conv.otherUser.first_name} ${conv.otherUser.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-gray-400">
                {conv.otherUser.first_name[0]}{conv.otherUser.last_name[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate">
                {conv.otherUser.first_name} {conv.otherUser.last_name}
              </h3>
              {conv.lastMessage && (
                <span className="text-xs text-gray-500">
                  {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {conv.lastMessage && (
              <p className="text-sm text-gray-500 truncate">
                {conv.lastMessage.sender_id === conv.otherUser.id ? '' : 'You: '}
                {conv.lastMessage.content}
              </p>
            )}
          </div>
          {conv.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {conv.unreadCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
