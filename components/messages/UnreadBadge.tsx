'use client'

import { useState, useEffect } from 'react'

export default function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/messages/unread-count')
      const data = await res.json()
      setCount(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  if (count === 0) return null

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {count > 99 ? '99+' : count}
    </span>
  )
}
