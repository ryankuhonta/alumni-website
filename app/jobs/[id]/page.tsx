import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) {
    notFound()
  }

  const jobTypeLabels = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    freelance: 'Freelance',
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <p className="text-xl mt-2" style={{ color: 'var(--primary-color)' }}>{job.company}</p>
              {job.location && (
                <p className="text-gray-500 mt-1">{job.location}</p>
              )}
            </div>
            <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded">
              {jobTypeLabels[job.job_type as keyof typeof jobTypeLabels]}
            </span>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-bold">Description</h2>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.requirements && (
            <div className="prose max-w-none mb-8">
              <h2 className="text-xl font-bold">Requirements</h2>
              <p className="whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4">How to Apply</h2>
            <div className="space-y-2">
              {job.application_link && (
                <a
                  href={job.application_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-white px-6 py-2 rounded hover:opacity-90"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  Apply Now
                </a>
              )}
              {job.application_email && (
                <p className="text-gray-600">
                  Or send your application to:{' '}
                  <a
                    href={`mailto:${job.application_email}`}
                    className="hover:underline"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    {job.application_email}
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-400 mt-8">
            Posted {new Date(job.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
