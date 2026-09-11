import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to the LDSP Alumni Association - Connect with fellow Lasallian alumni, join events, and discover opportunities.',
}

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
    .select('logo_url, school_logo_url, show_logo_hero, site_name, tagline')
    .limit(1)
    .single()

  const siteName = orgInfo?.site_name || 'LDSP Alumni Association'
  const tagline = orgInfo?.tagline || 'Connecting Lasallian alumni for a lifetime'

  return (
    <div>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--primary-color)' }} className="text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {orgInfo?.show_logo_hero && orgInfo?.logo_url && (
            <img
              src={orgInfo.logo_url}
              alt="Logo"
              className="h-24 md:h-32 mx-auto mb-6 object-contain"
            />
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {siteName}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {tagline}
          </p>
          <div className="space-x-4">
            <Link
              href="/register"
              className="bg-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              style={{ color: 'var(--primary-color)' }}
            >
              Join Now
            </Link>
            <Link
              href="/directory"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10"
            >
              Browse Directory
            </Link>
          </div>
          {orgInfo?.show_logo_hero && orgInfo?.school_logo_url && (
            <img
              src={orgInfo.school_logo_url}
              alt="School Logo"
              className="h-24 md:h-32 mx-auto mt-8 object-contain"
            />
          )}
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
                  <div style={{ color: 'var(--primary-color)' }} className="font-semibold">
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-bold mt-2">{event.title}</h3>
                  <p className="text-gray-600 mt-2 line-clamp-2">
                    {event.description}
                  </p>
                  {event.venue && (
                    <p className="text-gray-500 text-sm mt-2">
                      {event.venue}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming events yet.</p>
          )}
          <Link href="/events" className="hover:underline mt-4 inline-block" style={{ color: 'var(--primary-color)' }}>
            View all events &rarr;
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
                  <p className="text-gray-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No announcements yet.</p>
          )}
          <Link href="/announcements" className="hover:underline mt-4 inline-block" style={{ color: 'var(--primary-color)' }}>
            View all announcements &rarr;
          </Link>
        </div>
      </section>

      {/* Opportunities Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Opportunities</h2>
          <p className="text-gray-600 mb-8">
            Find jobs, services, and products posted by fellow alumni
          </p>
          <Link
            href="/jobs"
            className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            Browse Opportunities
          </Link>
        </div>
      </section>
    </div>
  )
}
