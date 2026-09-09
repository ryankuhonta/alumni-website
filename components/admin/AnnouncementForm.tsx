'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

interface AnnouncementFormProps {
  initialData?: {
    id?: string
    title: string
    content: string
    is_pinned: boolean
  }
}

export default function AnnouncementForm({
  initialData,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned || false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const data = {
      title,
      content,
      is_pinned: isPinned,
      created_by: user!.id,
    }

    let error = null
    let insertedId = null

    if (initialData?.id) {
      const { error: updateError } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', initialData.id)
      error = updateError
    } else {
      const { data: insertData, error: insertError } = await supabase.from('announcements').insert(data).select('id').single()
      error = insertError
      insertedId = insertData?.id
    }

    if (error) {
      console.error('Error saving announcement:', error)
      alert('Failed to save announcement: ' + error.message)
    } else {
      if (initialData?.id) {
        await logActivity({
          action: 'announcement.update',
          targetType: 'announcement',
          targetId: initialData.id,
          targetName: title,
          details: {
            before: { title: initialData.title, is_pinned: initialData.is_pinned },
            after: { title, is_pinned: isPinned }
          }
        })
      } else {
        await logActivity({
          action: 'announcement.create',
          targetType: 'announcement',
          targetId: insertedId,
          targetName: title,
          details: { after: { title, is_pinned: isPinned } }
        })
      }
    }

    setLoading(false)
    router.push('/admin/announcements')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          className="rounded"
        />
        <span>Pin this announcement</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {loading
          ? 'Saving...'
          : initialData?.id
          ? 'Update Announcement'
          : 'Create Announcement'}
      </button>
    </form>
  )
}
