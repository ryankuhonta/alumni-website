import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RSVPButton from '@/components/events/RSVPButton'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRSVP = null
  if (user) {
    const { data } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single()
    userRSVP = data?.status || null
  }

  const { data: rsvpCounts } = await supabase
    .from('event_rsvps')
    .select('status')
    .eq('event_id', id)

  const goingCount = rsvpCounts?.filter((r) => r.status === 'going').length || 0
  const maybeCount = rsvpCounts?.filter((r) => r.status === 'maybe').length || 0

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        {event.cover_image && (
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-64 object-cover rounded-lg mb-8"
          />
        )}

        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

        <div className="font-semibold mb-4" style={{ color: 'var(--primary-color)' }}>
          {new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {event.event_time && ` at ${event.event_time}`}
        </div>

        {event.venue && (
          <p className="text-gray-600 mb-4">
            {event.venue}
            {event.map_url && (
              <a
                href={event.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline ml-2"
                style={{ color: 'var(--primary-color)' }}
              >
                (View Map)
              </a>
            )}
          </p>
        )}

        <div className="prose max-w-none mb-8">
          <p>{event.description}</p>
        </div>

        {/* RSVP Section */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">RSVP</h2>
            <RSVPButton
              eventId={id}
              currentRSVP={userRSVP}
              userId={user.id}
            />
            <div className="mt-4 text-sm text-gray-600">
              <span className="font-semibold">{goingCount}</span> going
              <span className="mx-2">·</span>
              <span className="font-semibold">{maybeCount}</span> maybe
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
