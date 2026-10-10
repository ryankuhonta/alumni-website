import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventForm from '@/components/admin/EventForm'

export default async function AdminEditEventPage({
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <Link
          href="/admin/events"
          className="text-blue-700 hover:underline"
        >
          &larr; Back to Events
        </Link>
      </div>

      <EventForm
        initialData={{
          id: event.id,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          event_time: event.event_time || '',
          venue: event.venue || '',
          map_url: event.map_url || '',
          cover_image: event.cover_image,
        }}
      />
    </div>
  )
}
