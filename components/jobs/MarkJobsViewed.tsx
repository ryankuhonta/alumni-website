'use client'

import { useEffect } from 'react'

export default function MarkJobsViewed() {
  useEffect(() => {
    fetch('/api/jobs/read', { method: 'POST' })
  }, [])

  return null
}
