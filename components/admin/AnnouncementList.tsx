'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'
import AnnouncementForm from '@/components/admin/AnnouncementForm'

interface AnnouncementListProps {
  announcements: {
    id: string
    title: string
    content: string
    created_at: string
    is_pinned: boolean
    created_by: string
    cover_image?: string | null
    expires_at?: string | null
  }[]
}

export default function AnnouncementList({ announcements }: AnnouncementListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
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
      await logActivity({
        action: 'announcement.delete',
        targetType: 'announcement',
        targetId: id,
        targetName: title,
        details: { before: { title } }
      })
      router.refresh()
    }

    setDeleting(null)
  }

  const handleEdit = (id: string) => {
    setEditing(id)
  }

  const handleCancelEdit = () => {
    setEditing(null)
  }

  const isExpired = (expires_at: string | null | undefined) => {
    if (!expires_at) return false
    return new Date(expires_at) < new Date()
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div key={announcement.id} className={`border rounded p-4 ${isExpired(announcement.expires_at) ? 'bg-gray-50 opacity-70' : ''}`}>
          {editing === announcement.id ? (
            <div>
              <AnnouncementForm
                initialData={{
                  id: announcement.id,
                  title: announcement.title,
                  content: announcement.content,
                  is_pinned: announcement.is_pinned,
                  cover_image: announcement.cover_image,
                  expires_at: announcement.expires_at,
                }}
                onSave={handleCancelEdit}
              />
              <button
                onClick={handleCancelEdit}
                className="mt-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{announcement.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(announcement.created_at).toLocaleDateString()}
                  {announcement.is_pinned && ' · 📌 Pinned'}
                  {isExpired(announcement.expires_at) && ' · ⏰ Expired'}
                  {!isExpired(announcement.expires_at) && announcement.expires_at && (
                    <> · Expires {new Date(announcement.expires_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(announcement.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(announcement.id, announcement.title)}
                  disabled={deleting === announcement.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deleting === announcement.id ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
