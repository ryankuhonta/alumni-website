'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { JobType } from '@/types/database'

export default function JobForm() {
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [applicationLink, setApplicationLink] = useState('')
  const [applicationEmail, setApplicationEmail] = useState('')
  const [jobType, setJobType] = useState<JobType>('full_time')
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
      setError('You must be logged in to post a job.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('jobs').insert({
      title,
      company,
      location: location || null,
      description,
      requirements: requirements || null,
      application_link: applicationLink || null,
      application_email: applicationEmail || null,
      job_type: jobType,
      posted_by: user.id,
      status: 'active',
    })

    if (insertError) {
      setError('Failed to post job. Please try again.')
      setLoading(false)
      return
    }

    router.push('/jobs')
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? 'Posting...' : 'Post Opportunity'}
      </button>
    </form>
  )
}
