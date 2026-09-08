'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Officer } from '@/types/database'

interface OfficerFormProps {
  officer?: Officer | null
  onSave: () => void
  onCancel: () => void
}

export default function OfficerForm({ officer, onSave, onCancel }: OfficerFormProps) {
  const [name, setName] = useState(officer?.name || '')
  const [position, setPosition] = useState(officer?.position || '')
  const [termYear, setTermYear] = useState(officer?.term_year || '')
  const [displayOrder, setDisplayOrder] = useState(officer?.display_order || 0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    if (officer?.id) {
      await supabase
        .from('officers')
        .update({ name, position, term_year: termYear || null, display_order: displayOrder })
        .eq('id', officer.id)
    } else {
      await supabase.from('officers').insert({
        name,
        position,
        term_year: termYear || null,
        display_order: displayOrder,
      })
    }

    setLoading(false)
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-gray-50">
      <h3 className="font-bold text-lg">{officer ? 'Edit Officer' : 'Add Officer'}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Position *</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Term Year</label>
          <input
            type="text"
            value={termYear}
            onChange={(e) => setTermYear(e.target.value)}
            placeholder="e.g. 2024-2025"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border px-4 py-2 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
