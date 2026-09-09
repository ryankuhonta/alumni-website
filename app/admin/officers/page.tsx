'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Officer } from '@/types/database'
import OfficerForm from '@/components/admin/OfficerForm'

export default function AdminOfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null)
  const supabase = createClient()

  const fetchOfficers = async () => {
    const { data } = await supabase
      .from('officers')
      .select('*')
      .order('display_order', { ascending: true })
    setOfficers(data || [])
  }

  useEffect(() => {
    fetchOfficers()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this officer?')) return
    await supabase.from('officers').delete().eq('id', id)
    fetchOfficers()
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingOfficer(null)
    fetchOfficers()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Officers</h1>
        <button
          onClick={() => { setEditingOfficer(null); setShowForm(true) }}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          + Add Officer
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <OfficerForm
            officer={editingOfficer}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingOfficer(null) }}
          />
        </div>
      )}

      {officers.length > 0 ? (
        <div className="space-y-3">
          {officers.map((officer) => (
            <div key={officer.id} className="border rounded p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">{officer.name}</h3>
                <p className="text-sm text-gray-500">
                  {officer.position}
                  {officer.term_year && ` · ${officer.term_year}`}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => { setEditingOfficer(officer); setShowForm(true) }}
                  className="text-blue-700 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(officer.id)}
                  className="text-red-700 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No officers yet. Click &quot;+ Add Officer&quot; to add one.</p>
      )}
    </div>
  )
}
