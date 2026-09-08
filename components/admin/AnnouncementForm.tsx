'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

    if (initialData?.id) {
      await supabase
        .from('announcements')
        .update(data)
        .eq('id', initialData.id)
    } else {
      await supabase.from('announcements').insert(data)
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
        className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 disabled:opacity-50"
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
