'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatThread from '@/components/messages/ChatThread'
import MessageInput from '@/components/messages/MessageInput'

export default function ConversationPage({ id }: { id: string }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', id)
        .eq('user_id', user.id)
        .single()

      setAuthorized(!!data)
    }

    checkAuth()
  }, [id, router])

  if (authorized === null) {
    return (
      <div className="py-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-gray-500">
          Loading...
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="py-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-gray-500">
          Conversation not found or you don&apos;t have access.
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white border rounded-lg h-[calc(100vh-200px)] flex flex-col">
          <ChatThread conversationId={id} />
          <MessageInput
            conversationId={id}
            onMessageSent={() => window.location.reload()}
          />
        </div>
      </div>
    </div>
  )
}
