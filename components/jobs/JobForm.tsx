'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { JobType } from '@/types/database'
import { logActivity } from '@/lib/activity-log'

interface JobFormProps {
  initialData?: {
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
  }
  onSave?: () => void
}

export default function JobForm({ initialData, onSave }: JobFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [company, setCompany] = useState(initialData?.company || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [requirements, setRequirements] = useState(initialData?.requirements || '')
  const [applicationLink, setApplicationLink] = useState(initialData?.application_link || '')
  const [applicationEmail, setApplicationEmail] = useState(initialData?.application_email || '')
  const [jobType, setJobType] = useState<JobType>(initialData?.job_type || 'full_time')
  const [status, setStatus] = useState(initialData?.status || 'active')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in.')
      setLoading(false)
      return
    }

    const data = {
      title,
      company,
      location: location || null,
      description,
      requirements: requirements || null,
      application_link: applicationLink || null,
      application_email: applicationEmail || null,
      job_type: jobType,
      status,
    }

    let error2 = null

    if (initialData?.id) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update(data)
        .eq('id', initialData.id)
      error2 = updateError

      if (!updateError) {
        try {
          await logActivity({
            action: 'job.update',
            targetType: 'job',
            targetId: initialData.id,
            targetName: title,
            details: {
              before: { title: initialData.title, status: initialData.status },
              after: { title, status }
            }
          })
        } catch (e) { console.error('Activity log failed:', e) }
      }
    } else {
      const { error: insertError } = await supabase.from('jobs').insert({
        ...data,
        posted_by: user.id,
      })
      error2 = insertError

      if (!insertError) {
        try {
          await logActivity({
            action: 'job.create',
            targetType: 'job',
            targetName: title,
            details: { after: { title, job_type: jobType } }
          })
        } catch (e) { console.error('Activity log failed:', e) }
      }
    }

    if (error2) {
      setError('Failed to save: ' + error2.message)
      setLoading(false)
      return
    }

    if (initialData?.id) {
      if (onSave) {
        onSave()
      } else {
        router.refresh()
      }
    } else {
      router.push('/jobs')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Software Engineer, Web Design Service, LDSP Merchandise"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Company / Business *</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type *</label>
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value as JobType)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="full_time">Job - Full-time</option>
          <option value="part_time">Job - Part-time</option>
          <option value="contract">Job - Contract</option>
          <option value="freelance">Job - Freelance</option>
          <option value="service">Service</option>
          <option value="product">Product</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Requirements</label>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Application Link
        </label>
        <input
          type="url"
          value={applicationLink}
          onChange={(e) => setApplicationLink(e.target.value)}
          placeholder="https://..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Application Email
        </label>
        <input
          type="email"
          value={applicationEmail}
          onChange={(e) => setApplicationEmail(e.target.value)}
          placeholder="hr@company.com"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {initialData?.id && (
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        {loading
          ? 'Saving...'
          : initialData?.id
          ? 'Update Opportunity'
          : 'Post Opportunity'}
      </button>
    </form>
  )
}
