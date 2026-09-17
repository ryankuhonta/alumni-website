'use client'

import { useEffect } from 'react'

export default function MarkAnnouncementsViewed() {
  useEffect(() => {
    fetch('/api/announcements/read', { method: 'POST' })
  }, [])

  return null
}
