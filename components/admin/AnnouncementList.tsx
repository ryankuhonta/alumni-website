'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AnnouncementListProps {
  announcements: {
    id: string
    title: string
    created_at: string
    is_pinned: boolean
  }[]
}

export default function AnnouncementList({ announcements }: AnnouncementListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete announcement "${title}"?`)) return

    setDeleting(id)
    const supabase = createClient()

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting announcement: ' + error.message)
    } else {
      router.refresh()
    }

    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="border rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{announcement.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(announcement.created_at).toLocaleDateString()}
                {announcement.is_pinned && ' · 📌 Pinned'}
              </p>
            </div>
            <button
              onClick={() => handleDelete(announcement.id, announcement.title)}
              disabled={deleting === announcement.id}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {deleting === announcement.id ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
