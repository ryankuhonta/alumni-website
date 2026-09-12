'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewConversationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const to = searchParams.get('to')

  useEffect(() => {
    if (!to) {
      router.push('/messages')
      return
    }

    const startConversation = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      try {
        const res = await fetch('/api/messages/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId: to }),
        })
        const data = await res.json()
        if (data.conversationId) {
          router.push(`/messages/${data.conversationId}`)
        } else {
          router.push('/messages')
        }
      } catch (error) {
        console.error('Failed to start conversation:', error)
        router.push('/messages')
      }
    }

    startConversation()
  }, [to, router])

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <p className="text-gray-500">Starting conversation...</p>
      </div>
    </div>
  )
}
