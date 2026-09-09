'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RSVPStatus } from '@/types/database'

interface RSVPButtonProps {
  eventId: string
  currentRSVP: RSVPStatus | null
  userId: string
}

export default function RSVPButton({
  eventId,
  currentRSVP,
  userId,
}: RSVPButtonProps) {
  const [status, setStatus] = useState<RSVPStatus | null>(currentRSVP)
  const [loading, setLoading] = useState(false)

  const handleRSVP = async (newStatus: RSVPStatus) => {
    setLoading(true)
    const supabase = createClient()

    if (status) {
      // Update existing RSVP
      const { error } = await supabase
        .from('event_rsvps')
        .update({ status: newStatus })
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (!error) setStatus(newStatus)
    } else {
      // Create new RSVP
      const { error } = await supabase.from('event_rsvps').insert({
        event_id: eventId,
        user_id: userId,
        status: newStatus,
      })

      if (!error) setStatus(newStatus)
    }

    setLoading(false)
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => handleRSVP('going')}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          status === 'going'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        Going
      </button>
      <button
        onClick={() => handleRSVP('maybe')}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          status === 'maybe'
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        Maybe
      </button>
      <button
        onClick={() => handleRSVP('not_going')}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          status === 'not_going'
            ? 'bg-red-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        Not Going
      </button>
    </div>
  )
}
