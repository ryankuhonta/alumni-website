import { createClient } from '@/lib/supabase/server'
import AnnouncementForm from '@/components/admin/AnnouncementForm'
import AnnouncementList from '@/components/admin/AnnouncementList'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()

  const [{ data: announcements }, { data: orgInfo }] = await Promise.all([
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('organization_info').select('max_announcement_images').single(),
  ])

  const maxImages = orgInfo?.max_announcement_images || 1

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Announcements</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Create New Announcement</h2>
        <AnnouncementForm maxImages={maxImages} />
      </div>

      <h2 className="text-lg font-semibold mb-4">Existing Announcements</h2>
      {announcements && announcements.length > 0 ? (
        <AnnouncementList announcements={announcements} maxImages={maxImages} />
      ) : (
        <p className="text-gray-500">No announcements yet.</p>
      )}
    </div>
  )
}
