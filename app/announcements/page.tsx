import { createClient } from '@/lib/supabase/server'

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Announcements</h1>

        {announcements && announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`border rounded-lg p-6 ${
                  announcement.is_pinned ? 'border-green-500 bg-green-50' : ''
                }`}
              >
                {announcement.is_pinned && (
                  <span className="text-green-700 text-sm font-semibold">
                    📌 Pinned
                  </span>
                )}
                <div className="text-sm text-gray-500 mb-2">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </div>
                <h2 className="text-xl font-bold mb-2">{announcement.title}</h2>
                <p className="text-gray-700">{announcement.content}</p>
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