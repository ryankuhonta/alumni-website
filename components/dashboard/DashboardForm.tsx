'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

interface DashboardFormProps {
  profile: User
}

export default function DashboardForm({ profile }: DashboardFormProps) {
  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [currentCompany, setCurrentCompany] = useState(
    profile.current_company || ''
  )
  const [location, setLocation] = useState(profile.location || '')
  const [privacyCompany, setPrivacyCompany] = useState(profile.privacy_company)
  const [privacyLocation, setPrivacyLocation] = useState(
    profile.privacy_location
  )
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        current_company: currentCompany || null,
        location: location || null,
        privacy_company: privacyCompany,
        privacy_location: privacyLocation,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError('Failed to update profile.')
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Personal Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Current Company
          </label>
          <input
            type="text"
            value={currentCompany}
            onChange={(e) => setCurrentCompany(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Batch Year</label>
          <input
            type="number"
            value={profile.batch_year}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
          <p className="text-sm text-gray-500 mt-1">
            Contact admin to change batch year
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>

        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={privacyCompany}
              onChange={(e) => setPrivacyCompany(e.target.checked)}
              className="rounded"
            />
            <span>Hide my company from public profile</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={privacyLocation}
              onChange={(e) => setPrivacyLocation(e.target.checked)}
              className="rounded"
            />
            <span>Hide my location from public profile</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
