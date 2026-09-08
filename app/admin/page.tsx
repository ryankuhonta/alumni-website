import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [{ count: usersCount }, { count: eventsCount }, { count: jobsCount }, { count: announcementsCount }] =
    await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('announcements').select('*', { count: 'exact', head: true }),
    ])

  const stats = [
    { label: 'Total Alumni', value: usersCount || 0, color: 'bg-blue-500' },
    { label: 'Events', value: eventsCount || 0, color: 'bg-green-500' },
    { label: 'Job Posts', value: jobsCount || 0, color: 'bg-yellow-500' },
    { label: 'Announcements', value: announcementsCount || 0, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} text-white rounded-lg p-6`}
          >
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
