'use client'

import { useState, useRef } from 'react'
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
  const [profilePicture, setProfilePicture] = useState(
    profile.profile_picture || ''
  )
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2MB or smaller.')
      return
    }

    setUploading(true)
    setError(null)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const filePath = `${profile.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError('Failed to upload image.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    await supabase
      .from('users')
      .update({ profile_picture: data.publicUrl })
      .eq('id', profile.id)

    setProfilePicture(data.publicUrl)
    setUploading(false)
    setSuccess(true)
  }

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

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

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
        <h2 className="text-xl font-bold mb-4">Profile Picture</h2>

        <div className="flex items-center space-x-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-400">
                  {initials}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              <span className="text-white text-sm">
                {uploading ? 'Uploading...' : 'Change'}
              </span>
            </button>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-green-700 hover:underline disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload new photo'}
            </button>
            <p className="text-sm text-gray-500 mt-1">
              JPG or PNG, max 2MB
            </p>
          </div>
        </div>
      </div>

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
