import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileView from '@/components/directory/ProfileView'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!user) {
    notFound()
  }

  return (
    <div className="py-12">
      <ProfileView user={user} currentUserId={authUser?.id} />
    </div>
  )
}
