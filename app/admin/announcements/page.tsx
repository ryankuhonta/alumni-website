import { createClient } from '@/lib/supabase/server'
import AnnouncementForm from '@/components/admin/AnnouncementForm'
import AnnouncementList from '@/components/admin/AnnouncementList'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
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
        <AnnouncementList announcements={announcements} />
      ) : (
        <p className="text-gray-500">No announcements yet.</p>
      )}
    </div>
  )
}
