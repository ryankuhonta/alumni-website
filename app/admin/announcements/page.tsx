import { createClient } from '@/lib/supabase/server'
import AnnouncementForm from '@/components/admin/AnnouncementForm'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Announcements</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Create New Announcement</h2>
        <AnnouncementForm />
      </div>

      <h2 className="text-lg font-semibold mb-4">Existing Announcements</h2>
      {announcements && announcements.length > 0 ? (
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No announcements yet.</p>
      )}
    </div>
  )
}
