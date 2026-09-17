'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'
import JobForm from '@/components/jobs/JobForm'
import type { JobType } from '@/types/database'

interface Job {
  id: string
  title: string
  company: string
  location: string | null
  description: string
  requirements: string | null
  application_link: string | null
  application_email: string | null
  job_type: JobType
  status: string
  created_at: string
  posted_by: string | null
}

interface AdminJobsPageProps {
  jobs: Job[]
}

export default function AdminJobList({ jobs }: AdminJobsPageProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const router = useRouter()

  const jobTypeLabels: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    freelance: 'Freelance',
    service: 'Service',
    product: 'Product',
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete opportunity "${title}"?`)) return

    setDeleting(id)
    const supabase = createClient()

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting: ' + error.message)
    } else {
      await logActivity({
        action: 'job.delete',
        targetType: 'job',
        targetId: id,
        targetName: title,
        details: { before: { title } }
      })
      router.refresh()
    }

    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="border rounded p-4">
          {editing === job.id ? (
            <div>
              <JobForm initialData={job} />
              <button
                onClick={() => setEditing(null)}
                className="mt-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{job.title}</h3>
                <p className="text-sm text-gray-500">
                  {job.company} · {jobTypeLabels[job.job_type]}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                    job.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditing(job.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(job.id, job.title)}
                  disabled={deleting === job.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deleting === job.id ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
