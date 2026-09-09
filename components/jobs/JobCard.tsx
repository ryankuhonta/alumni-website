import Link from 'next/link'
import { Job } from '@/types/database'

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const jobTypeLabels = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    freelance: 'Freelance',
  }

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block border rounded-lg p-6 hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">{job.title}</h3>
          <p style={{ color: 'var(--primary-color)' }}>{job.company}</p>
          {job.location && (
            <p className="text-gray-500 text-sm">📍 {job.location}</p>
          )}
        </div>
        <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded">
          {jobTypeLabels[job.job_type]}
        </span>
      </div>
      <p className="text-gray-600 mt-3 line-clamp-2">{job.description}</p>
      <div className="text-sm text-gray-400 mt-3">
        Posted {new Date(job.created_at).toLocaleDateString()}
      </div>
    </Link>
  )
}