import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EventForm from '@/components/admin/EventForm'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Events</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Create New Event</h2>
        <EventForm />
      </div>

      <h2 className="text-lg font-semibold mb-4">Existing Events</h2>
      {events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="text-green-700 hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No events yet.</p>
      )}
    </div>
  )
}
