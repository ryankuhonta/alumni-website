'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

interface EventFormProps {
  initialData?: {
    id?: string
    title: string
    description: string
    event_date: string
    event_time: string
    venue: string
    map_url: string
  }
}

export default function EventForm({ initialData }: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(
    initialData?.description || ''
  )
  const [eventDate, setEventDate] = useState(initialData?.event_date || '')
  const [eventTime, setEventTime] = useState(initialData?.event_time || '')
  const [venue, setVenue] = useState(initialData?.venue || '')
  const [mapUrl, setMapUrl] = useState(initialData?.map_url || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const data = {
      title,
      description,
      event_date: eventDate,
      event_time: eventTime || null,
      venue: venue || null,
      map_url: mapUrl || null,
      created_by: user!.id,
    }

    let error = null
    let insertedId = null

    if (initialData?.id) {
      const { error: updateError } = await supabase.from('events').update(data).eq('id', initialData.id)
      error = updateError
    } else {
      const { data: insertData, error: insertError } = await supabase.from('events').insert(data).select('id').single()
      error = insertError
      insertedId = insertData?.id
    }

    if (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event: ' + error.message)
    } else {
      if (initialData?.id) {
        await logActivity({
          action: 'event.update',
          targetType: 'event',
          targetId: initialData.id,
          targetName: title,
          details: {
            before: { title: initialData.title, event_date: initialData.event_date },
            after: { title, event_date: eventDate }
          }
        })
      } else {
        await logActivity({
          action: 'event.create',
          targetType: 'event',
          targetId: insertedId,
          targetName: title,
          details: { after: { title, event_date: eventDate } }
        })
      }
    }

    setLoading(false)
    router.push('/admin/events')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Venue</label>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Map URL</label>
        <input
          type="url"
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          placeholder="https://maps.google.com/..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : initialData?.id ? 'Update Event' : 'Create Event'}
      </button>
    </form>
  )
}
