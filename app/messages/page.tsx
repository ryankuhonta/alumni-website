import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InboxList from '@/components/messages/InboxList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages',
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        <div className="bg-white border rounded-lg">
          <InboxList />
        </div>
      </div>
    </div>
  )
}
