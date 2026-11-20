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

      // Keep the user's viewport anchored while older messages are prepended.
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
