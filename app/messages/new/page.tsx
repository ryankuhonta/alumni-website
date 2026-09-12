'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewConversationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const to = searchParams.get('to')
  const [recipientName, setRecipientName] = useState('')
  const [recipientLoading, setRecipientLoading] = useState(true)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!to) {
      router.push('/messages')
      return
    }

    const loadRecipient = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', to)
        .single()

      if (data) {
        setRecipientName(`${data.first_name} ${data.last_name}`)
      }
      setRecipientLoading(false)
    }

    loadRecipient()
  }, [to, router])

  const handleSend = async () => {
    if (!content.trim() || sending || !to) return

    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: to, content: content.trim() }),
      })
      const data = await res.json()
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`)
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      setError('Network error')
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

  if (!to) return null

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">
          {recipientLoading ? 'Loading...' : `Message ${recipientName}`}
        </h1>
        <div className="bg-white border rounded-lg h-[calc(100vh-250px)] flex flex-col">
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Send the first message to start the conversation</p>
          </div>
          <div className="border-t p-4">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={sending || recipientLoading}
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!content.trim() || sending || recipientLoading}
                className="text-white px-4 py-2 rounded-lg disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
