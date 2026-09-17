import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from '@/components/admin/UserTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/admin')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('batch_year', { ascending: true })
    .order('last_name', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>

      {users && users.length > 0 ? (
        <UserTable users={users} />
      ) : (
        <p className="text-gray-500">No users yet.</p>
      )}
    </div>
  )
}
