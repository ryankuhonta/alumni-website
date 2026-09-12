'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { toTitleCase, LOCATION_DATA, REGIONS, getProvincesByRegion, formatLocation, parseLocation3Level } from '@/lib/utils'

interface DashboardFormProps {
  profile: User
}

export default function DashboardForm({ profile }: DashboardFormProps) {
  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [currentCompany, setCurrentCompany] = useState(
    profile.current_company || ''
  )
  const [region, setRegion] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [mobileNumber, setMobileNumber] = useState(profile.mobile_number || '')
  const [jobTitle, setJobTitle] = useState(profile.job_title || '')
  const [facebookUrl, setFacebookUrl] = useState(profile.facebook_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || '')
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

  // Parse existing location on mount
  useEffect(() => {
    if (profile.location) {
      const parsed = parseLocation3Level(profile.location)
      setRegion(parsed.region)
      setProvince(parsed.province)
      setCity(parsed.city)
    }
  }, [profile.location])

  const provincesInRegion = useMemo(() => {
    if (!region) return []
    return getProvincesByRegion(region)
  }, [region])

  const selectedProvince = useMemo(() => {
    return LOCATION_DATA.find(p => p.name === province)
  }, [province])

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegion(e.target.value)
    setProvince('')
    setCity('')
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvince(e.target.value)
    setCity('')
  }

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

    const locationValue = formatLocation(province, city)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: toTitleCase(firstName),
        last_name: toTitleCase(lastName),
        current_company: currentCompany || null,
        location: locationValue || null,
        mobile_number: mobileNumber || null,
        job_title: jobTitle || null,
        facebook_url: facebookUrl || null,
        linkedin_url: linkedinUrl || null,
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
        <div className="p-3 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, white)', color: 'var(--primary-color)' }}>
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
              className="hover:underline disabled:opacity-50"
              style={{ color: 'var(--primary-color)' }}
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

        {/* 3-Level Location Cascading */}
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium">Location</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <select
                value={region}
                onChange={handleRegionChange}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Region</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={province}
                onChange={handleProvinceChange}
                disabled={!region}
                className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">{!region ? 'Region first' : 'Province'}</option>
                {provincesInRegion.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province || !selectedProvince?.cities.length}
                className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">
                  {!province ? 'Province first' : !selectedProvince?.cities.length ? 'N/A' : 'City'}
                </option>
                {selectedProvince?.cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {selectedProvince?.cities.length === 0 && province !== 'Overseas' && (
                  <option value="Other">Other</option>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Job Title</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Software Engineer"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Mobile Number</label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="09XX XXX XXXX"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Facebook URL</label>
          <input
            type="url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/yourprofile"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
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
        className="w-full text-white py-2 rounded disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
