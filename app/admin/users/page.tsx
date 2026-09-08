import { createClient } from '@/lib/supabase/server'
import UserTable from '@/components/admin/UserTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

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
