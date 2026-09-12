'use client'

import { useState } from 'react'

interface MessageInputProps {
  conversationId: string
  onMessageSent: () => void
}

export default function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim() || sending) return

    setSending(true)
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content: content.trim() }),
      })
      setContent('')
      onMessageSent()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="text-white px-4 py-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
