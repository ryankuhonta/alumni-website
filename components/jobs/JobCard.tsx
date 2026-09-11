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
        <span className={`text-sm px-3 py-1 rounded ${jobTypeColors[job.job_type]}`}>
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