import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConversationView from '@/components/messages/ConversationView'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <ConversationView id={id} />
}
