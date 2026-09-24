import { createClient } from '@/lib/supabase/server'
import MarkAnnouncementsViewed from '@/components/announcements/MarkAnnouncementsViewed'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Announcements',
  description: 'Stay updated with the latest news and announcements from the LDSP Alumni Association.',
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      creator:users!announcements_created_by_fkey(first_name, last_name)
    `)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Announcements</h1>

        <MarkAnnouncementsViewed />

        {announcements && announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement: any) => (
              <div
                key={announcement.id}
                className={`border rounded-lg p-6 ${
                  announcement.is_pinned ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                {announcement.is_pinned && (
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary-color)' }}>
                    📌 Pinned
                  </span>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                  {announcement.creator && (
                    <>
                      <span>·</span>
                      <span>Posted by {announcement.creator.first_name} {announcement.creator.last_name}</span>
                    </>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2">{announcement.title}</h2>
                <div className="text-gray-700 whitespace-pre-wrap">{announcement.content}</div>
                {announcement.cover_image && (
                  <img
                    src={announcement.cover_image}
                    alt={announcement.title}
                    className="mt-4 rounded max-h-64 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No announcements yet.</p>
        )}
      </div>
    </div>
  )
}
