import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatThread from '@/components/messages/ChatThread'
import MessageInput from '@/components/messages/MessageInput'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params

  if (!user) redirect('/login')

  // Verify user is participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .single()

  if (!participant) notFound()

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
