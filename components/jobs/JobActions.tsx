'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'
import Link from 'next/link'

interface JobActionsProps {
  jobId: string
  jobTitle: string
  postedBy: string | null
  currentUserId: string
  currentUserRole: string
}

export default function JobActions({ jobId, jobTitle, postedBy, currentUserId, currentUserRole }: JobActionsProps) {
  const [deleting, setDeleting] = useState(false)
  const [posterRole, setPosterRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (postedBy && postedBy !== currentUserId) {
      const supabase = createClient()
      supabase
        .from('users')
        .select('role')
        .eq('id', postedBy)
        .single()
        .then(({ data }) => setPosterRole(data?.role || null))
    }
  }, [postedBy, currentUserId])

  const canEdit = (() => {
    if (!postedBy) return false
    if (postedBy === currentUserId) return true
    if (currentUserRole === 'admin') return true
    if (currentUserRole === 'moderator' && posterRole !== 'admin') return true
    return false
  })()

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
