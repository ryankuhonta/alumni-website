import Link from 'next/link'
import { Event } from '@/types/database'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block border rounded-lg overflow-hidden hover:shadow-lg transition"
    >
      {event.cover_image && (
        <img
          src={event.cover_image}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="text-green-700 font-semibold">
          {new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <h3 className="text-xl font-bold mt-2">{event.title}</h3>
        <p className="text-gray-600 mt-2 line-clamp-2">{event.description}</p>
        {event.venue && (
          <p className="text-gray-500 text-sm mt-2">📍 {event.venue}</p>
        )}
      </div>
    </Link>
  )
}
