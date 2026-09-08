'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrganizationInfo } from '@/types/database'

interface SettingsFormProps {
  initialData: OrganizationInfo | null
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const [mission, setMission] = useState(initialData?.mission || '')
  const [vision, setVision] = useState(initialData?.vision || '')
  const [about, setAbout] = useState(initialData?.about || '')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    const supabase = createClient()

    if (initialData?.id) {
      await supabase
        .from('organization_info')
        .update({ mission, vision, about })
        .eq('id', initialData.id)
    } else {
      await supabase.from('organization_info').insert({
        mission,
        vision,
        about,
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          Settings saved successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Mission *</label>
        <textarea
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          required
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Vision *</label>
        <textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          required
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          About (Additional Info)
        </label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
