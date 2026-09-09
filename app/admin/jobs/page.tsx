import { createClient } from '@/lib/supabase/server'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  const jobTypeLabels = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    freelance: 'Freelance',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Jobs</h1>

      {jobs && jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{job.title}</h3>
                  <p className="text-sm text-gray-500">
                    {job.company} · {jobTypeLabels[job.job_type as keyof typeof jobTypeLabels]}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    job.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No jobs yet.</p>
      )}
    </div>
  )
}
