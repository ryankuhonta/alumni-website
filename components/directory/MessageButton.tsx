'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MessageButtonProps {
  userId: string
}

export default function MessageButton({ userId }: MessageButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/messages/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId }),
      })
      const data = await res.json()
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`)
      } else {
        console.error('API error:', data)
        setError(data.error || 'Failed to start conversation')
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {loading ? 'Starting...' : 'Message'}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
