import { createClient } from '@/lib/supabase/server'
import AdminJobList from '@/components/admin/AdminJobList'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Opportunities</h1>

      {jobs && jobs.length > 0 ? (
        <AdminJobList jobs={jobs} />
      ) : (
        <p className="text-gray-500">No opportunities yet.</p>
      )}
    </div>
  )
}
