'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrganizationInfo } from '@/types/database'

interface SettingsFormProps {
  initialData: OrganizationInfo | null
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const [mission, setMission] = useState(initialData?.mission || '')
  const [vision, setVision] = useState(initialData?.vision || '')
  const [about, setAbout] = useState(initialData?.about || '')
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '')
  const [logoPreview, setLogoPreview] = useState(initialData?.logo_url || '')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo must be less than 5MB')
      return
    }

    setUploadingLogo(true)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `org-logo.${fileExt}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setLogoUrl(data.publicUrl)
      setLogoPreview(data.publicUrl)
    }

    setUploadingLogo(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    const supabase = createClient()

    if (initialData?.id) {
      await supabase
        .from('organization_info')
        .update({ mission, vision, about, logo_url: logoUrl })
        .eq('id', initialData.id)
    } else {
      await supabase.from('organization_info').insert({
        mission,
        vision,
        about,
        logo_url: logoUrl,
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
        <label className="block text-sm font-medium mb-1">Organization Logo</label>
        <div className="flex items-center gap-4">
          <div
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <span className="text-gray-400 text-2xl font-bold">Logo</span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-500 mt-1">Max 5MB. PNG, JPG, SVG.</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </div>

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
