'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Officer, User } from '@/types/database'
import { logActivity } from '@/lib/activity-log'

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
  const [userId, setUserId] = useState(officer?.user_id || '')
  const [users, setUsers] = useState<Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'profile_picture'>[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, profile_picture')
        .order('first_name')
      setUsers(data || [])
    }
    fetchUsers()
  }, [])

  const handleUserChange = (selectedUserId: string) => {
    setUserId(selectedUserId || '')
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId)
      if (user) {
        setName(`${user.first_name} ${user.last_name}`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let error = null
    let insertedId = null

    if (officer?.id) {
      const { error: updateError } = await supabase
        .from('officers')
        .update({ name, position, term_year: termYear || null, display_order: displayOrder, user_id: userId || null })
        .eq('id', officer.id)
      error = updateError
    } else {
      const { data: insertData, error: insertError } = await supabase.from('officers').insert({
        name,
        position,
        term_year: termYear || null,
        display_order: displayOrder,
        user_id: userId || null,
      }).select('id').single()
      error = insertError
      insertedId = insertData?.id
    }

    if (error) {
      console.error('Error saving officer:', error)
      alert('Failed to save officer: ' + error.message)
    } else {
      if (officer?.id) {
        await logActivity({
          action: 'officer.update',
          targetType: 'officer',
          targetId: officer.id,
          targetName: `${name} - ${position}`,
          details: {
            before: { name: officer.name, position: officer.position },
            after: { name, position }
          }
        })
      } else {
        await logActivity({
          action: 'officer.create',
          targetType: 'officer',
          targetId: insertedId,
          targetName: `${name} - ${position}`,
          details: { after: { name, position, term_year: termYear } }
        })
      }
    }

    setLoading(false)
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-gray-50">
      <h3 className="font-bold text-lg">{officer ? 'Edit Officer' : 'Add Officer'}</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Link to Alumni (optional)</label>
        <select
          value={userId}
          onChange={(e) => handleUserChange(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- None --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name} ({user.email})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Linking auto-fills the name and uses their profile picture
        </p>
      </div>

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
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
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
