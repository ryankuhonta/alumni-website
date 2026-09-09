import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobCard from '@/components/jobs/JobCard'
import Link from 'next/link'

export default async function JobsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Job Board</h1>
          <Link
            href="/jobs/new"
            className="text-white px-4 py-2 rounded hover:opacity-90"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            Post a Job
          </Link>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No job openings yet.</p>
        )}
      </div>
    </div>
  )
}
