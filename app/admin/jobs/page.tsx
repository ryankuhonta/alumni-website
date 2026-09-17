import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminJobList from '@/components/admin/AdminJobList'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Alumni Network</h1>

      {jobs && jobs.length > 0 ? (
        <AdminJobList
          jobs={jobs}
          currentUserRole={profile?.role || 'alumni'}
          currentUserId={user.id}
        />
      ) : (
        <p className="text-gray-500">No opportunities yet.</p>
      )}
    </div>
  )
}
