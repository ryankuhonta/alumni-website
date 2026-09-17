'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'
import Link from 'next/link'

interface JobActionsProps {
  jobId: string
  jobTitle: string
  postedBy: string | null
  currentUserId: string
  isAdmin: boolean
}

export default function JobActions({ jobId, jobTitle, postedBy, currentUserId, isAdmin }: JobActionsProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const canEdit = isAdmin || postedBy === currentUserId

  if (!canEdit) return null

  const handleDelete = async () => {
    if (!confirm(`Delete "${jobTitle}"?`)) return

    setDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      alert('Error deleting: ' + error.message)
      setDeleting(false)
      return
    }

    await logActivity({
      action: 'job.delete',
      targetType: 'job',
      targetId: jobId,
      targetName: jobTitle,
      details: { before: { title: jobTitle } }
    })

    router.push('/jobs')
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <Link
        href={`/jobs/${jobId}/edit`}
        className="text-blue-600 hover:text-blue-800"
      >
        ✏️ Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {deleting ? 'Deleting...' : '🗑️ Delete'}
      </button>
    </div>
  )
}
