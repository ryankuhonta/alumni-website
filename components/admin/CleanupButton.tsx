'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CleanupButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCleanup = async () => {
    const supabase = createClient()
    
    // Get retention setting
    const { data: settings } = await supabase
      .from('organization_info')
      .select('log_retention_years')
      .single()

    const years = settings?.log_retention_years || 0
    if (years === 0) {
      alert('Log retention is set to forever. Change retention years in Settings to enable cleanup.')
      return
    }

    if (!confirm(`Delete logs older than ${years} years?`)) return

    setLoading(true)

    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years)

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Old logs deleted successfully!')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleCleanup}
      disabled={loading}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? 'Cleaning up...' : 'Clear Old Logs'}
    </button>
  )
}