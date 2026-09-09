import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(3)

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('logo_url')
    .limit(1)
    .single()

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {orgInfo?.logo_url ? (
            <img
              src={orgInfo.logo_url}
              alt="LDSP Alumni Logo"
              className="h-24 md:h-32 mx-auto mb-6 object-contain"
            />
          ) : null}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            LDSP Alumni Association
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-100">
            Connecting Lasallian alumni for a lifetime
          </p>
          <div className="space-x-4">
            <Link
              href="/register"
              className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Join Now
            </Link>
            <Link
              href="/directory"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>
          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="border rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="text-green-700 font-semibold">
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-bold mt-2">{event.title}</h3>
                  <p className="text-gray-600 mt-2 line-clamp-2">
                    {event.description}
                  </p>
                  {event.venue && (
                    <p className="text-gray-500 text-sm mt-2">
                      📍 {event.venue}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming events yet.</p>
          )}
          <Link href="/events" className="text-green-700 hover:underline mt-4 inline-block">
            View all events →
          </Link>
        </div>
      </section>

      {/* Recent Announcements */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Recent Announcements</h2>
          {announcements && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white border rounded-lg p-6"
                >
                  <div className="text-sm text-gray-500">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-bold mt-2">{announcement.title}</h3>
                  <p className="text-gray-600 mt-2 line-clamp-3">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No announcements yet.</p>
          )}
          <Link href="/announcements" className="text-green-700 hover:underline mt-4 inline-block">
            View all announcements →
          </Link>
        </div>
      </section>

      {/* Job Board Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Job Board</h2>
          <p className="text-gray-600 mb-8">
            Find opportunities posted by fellow alumni
          </p>
          <Link
            href="/jobs"
            className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800"
          >
            Browse Jobs
          </Link>
        </div>
      </section>
    </div>
  )
}
