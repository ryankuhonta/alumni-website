import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import JobActions from '@/components/jobs/JobActions'

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
    .select(`
      *,
      poster:users!jobs_posted_by_fkey(id, first_name, last_name, avatar_url, job_title, current_company)
    `)
    .eq('id', id)
    .single()

  if (!job) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const jobTypeLabels = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    freelance: 'Freelance',
    service: 'Service',
    product: 'Product',
  }

  const jobTypeColors = {
    full_time: 'bg-blue-100 text-blue-800',
    part_time: 'bg-green-100 text-green-800',
    contract: 'bg-yellow-100 text-yellow-800',
    freelance: 'bg-purple-100 text-purple-800',
    service: 'bg-orange-100 text-orange-800',
    product: 'bg-pink-100 text-pink-800',
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
            <span className={`px-4 py-2 rounded ${jobTypeColors[job.job_type as keyof typeof jobTypeColors]}`}>
              {jobTypeLabels[job.job_type as keyof typeof jobTypeLabels]}
            </span>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-bold">Description</h2>
            <div className="whitespace-pre-wrap">{job.description}</div>
          </div>

          {job.requirements && (
            <div className="prose max-w-none mb-8">
              <h2 className="text-xl font-bold">
                {job.job_type === 'service' || job.job_type === 'product' ? "What's Included" : 'Requirements'}
              </h2>
              <div className="whitespace-pre-wrap">{job.requirements}</div>
            </div>
          )}

          {(job.application_link || job.application_email) && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">
                {job.job_type === 'service' || job.job_type === 'product' ? 'Contact' : 'How to Apply'}
              </h2>
              <div className="space-y-2">
                {job.application_link && (
                  <a
                    href={job.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-white px-6 py-2 rounded hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  >
                    {job.job_type === 'service' || job.job_type === 'product' ? 'Visit Website' : 'Apply Now'}
                  </a>
                )}
                {job.application_email && (
                  <p className="text-gray-600">
                    {job.job_type === 'service' || job.job_type === 'product'
                      ? 'Email: '
                      : 'Or send your application to: '}
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
          )}

          {job.poster && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Posted by</h2>
              <div className="flex items-center gap-4">
                {job.poster.avatar_url ? (
                  <img
                    src={job.poster.avatar_url}
                    alt={`${job.poster.first_name} ${job.poster.last_name}`}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                    {job.poster.first_name?.[0]}{job.poster.last_name?.[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg">{job.poster.first_name} {job.poster.last_name}</p>
                  {job.poster.job_title && job.poster.current_company && (
                    <p className="text-gray-500">{job.poster.job_title} at {job.poster.current_company}</p>
                  )}
                  {job.poster.job_title && !job.poster.current_company && (
                    <p className="text-gray-500">{job.poster.job_title}</p>
                  )}
                  {!job.poster.job_title && job.poster.current_company && (
                    <p className="text-gray-500">{job.poster.current_company}</p>
                  )}
                </div>
                <Link
                  href={`/directory/${job.poster.id}`}
                  className="text-white px-4 py-2 rounded hover:opacity-90"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  View Profile
                </Link>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-400 mt-8">
            Posted {new Date(job.created_at).toLocaleDateString()}
          </div>

          <JobActions
            jobId={job.id}
            jobTitle={job.title}
            postedBy={job.posted_by}
            currentUserId={user.id}
            currentUserRole={profile?.role || 'alumni'}
          />
        </div>
      </div>
    </div>
  )
}
