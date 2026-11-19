'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { MessageWithSender } from '@/types/messaging'
import MessageInput from '@/components/messages/MessageInput'

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
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      scrollIntent.current = { mode: 'bottom' }
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No messages yet. Send the first message!
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
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
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
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      <MessageInput conversationId={conversationId} onMessageSent={handleMessageSent} />
    </div>
  )
}
