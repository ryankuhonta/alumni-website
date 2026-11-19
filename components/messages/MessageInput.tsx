'use client'

import { useState } from 'react'
import { MessageWithSender } from '@/types/messaging'

interface MessageInputProps {
  conversationId: string
  onMessageSent: (message: MessageWithSender) => void
}

export default function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!content.trim() || sending) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content: content.trim() }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setContent('')
      if (data.message) onMessageSent(data.message)
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
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
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
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
