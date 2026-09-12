'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageWithSender } from '@/types/messaging'

interface ChatThreadProps {
  conversationId: string
}

export default function ChatThread({ conversationId }: ChatThreadProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    markAsRead()
  }, [conversationId])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading messages...</div>
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No messages yet. Send the first message!
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      <div ref={messagesEndRef} />
    </div>
  )
}
