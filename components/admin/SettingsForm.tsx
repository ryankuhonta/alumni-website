'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrganizationInfo } from '@/types/database'
import { logActivity } from '@/lib/activity-log'

interface SettingsFormProps {
  initialData: OrganizationInfo | null
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const [mission, setMission] = useState(initialData?.mission || '')
  const [vision, setVision] = useState(initialData?.vision || '')
  const [about, setAbout] = useState(initialData?.about || '')

  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '')
  const [logoPreview, setLogoPreview] = useState(initialData?.logo_url || '')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [schoolLogoUrl, setSchoolLogoUrl] = useState(initialData?.school_logo_url || '')
  const [schoolLogoPreview, setSchoolLogoPreview] = useState(initialData?.school_logo_url || '')
  const [uploadingSchoolLogo, setUploadingSchoolLogo] = useState(false)
  const [schoolLogoError, setSchoolLogoError] = useState('')
  const schoolLogoInputRef = useRef<HTMLInputElement>(null)

  const [showNavbar, setShowNavbar] = useState(initialData?.show_logo_navbar ?? true)
  const [showHero, setShowHero] = useState(initialData?.show_logo_hero ?? true)
  const [showFooter, setShowFooter] = useState(initialData?.show_logo_footer ?? true)
  const [showAbout, setShowAbout] = useState(initialData?.show_logo_about ?? true)
  const [showAlumniAbout, setShowAlumniAbout] = useState(initialData?.show_alumni_logo_about ?? true)

  const [siteName, setSiteName] = useState(initialData?.site_name || 'LDSP Alumni Association')
  const [tagline, setTagline] = useState(initialData?.tagline || 'Connecting Lasallian alumni for a lifetime')
  const [primaryColor, setPrimaryColor] = useState(initialData?.primary_color || '#1e40af')
  const [logRetentionYears, setLogRetentionYears] = useState(initialData?.log_retention_years || 0)

  const colorChoices = [
    { label: 'Blue', value: '#1e40af' },
    { label: 'Green', value: '#16a34a' },
    { label: 'Red', value: '#dc2626' },
    { label: 'Navy', value: '#1e3a5f' },
    { label: 'Purple', value: '#9333ea' },
    { label: 'Maroon', value: '#9d174d' },
    { label: 'Orange', value: '#ea580c' },
    { label: 'Teal', value: '#0d9488' },
  ]

  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'alumni' | 'school') => {
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

    const setUploading = type === 'alumni' ? setUploadingLogo : setUploadingSchoolLogo
    const setError = type === 'alumni' ? setLogoError : setSchoolLogoError
    const setUrl = type === 'alumni' ? setLogoUrl : setSchoolLogoUrl
    const setPreview = type === 'alumni' ? setLogoPreview : setSchoolLogoPreview

    setUploading(true)
    setError('')
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${type}-logo.${fileExt}`

    const { error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true })

    if (error) {
      console.error('Upload error:', error)
      setError(error.message)
    } else {
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName)
      setUrl(data.publicUrl)
      setPreview(data.publicUrl)
    }

    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    const supabase = createClient()

    const updateData = {
      mission,
      vision,
      about,
      logo_url: logoUrl,
      school_logo_url: schoolLogoUrl,
      show_logo_navbar: showNavbar,
      show_logo_hero: showHero,
      show_logo_footer: showFooter,
      show_logo_about: showAbout,
      show_alumni_logo_about: showAlumniAbout,
      site_name: siteName,
      tagline: tagline,
      primary_color: primaryColor,
      log_retention_years: logRetentionYears,
    }

    let error = null

    if (initialData?.id) {
      const { error: updateError } = await supabase
        .from('organization_info')
        .update(updateData)
        .eq('id', initialData.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('organization_info').insert(updateData)
      error = insertError
    }

    if (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings: ' + error.message)
    } else {
      if (initialData?.id) {
        const changes: Record<string, unknown> = {}
        const before: Record<string, unknown> = {}

        if (siteName !== initialData.site_name) {
          before.site_name = initialData.site_name
          changes.site_name = siteName
        }
        if (tagline !== initialData.tagline) {
          before.tagline = initialData.tagline
          changes.tagline = tagline
        }
        if (primaryColor !== initialData.primary_color) {
          before.primary_color = initialData.primary_color
          changes.primary_color = primaryColor
        }
        if (mission !== initialData.mission) {
          before.mission = initialData.mission
          changes.mission = mission
        }
        if (vision !== initialData.vision) {
          before.vision = initialData.vision
          changes.vision = vision
        }
        if (about !== initialData.about) {
          before.about = initialData.about
          changes.about = about
        }
        if (logoUrl !== initialData.logo_url) {
          before.logo_url = initialData.logo_url
          changes.logo_url = logoUrl
        }
        if (schoolLogoUrl !== initialData.school_logo_url) {
          before.school_logo_url = initialData.school_logo_url
          changes.school_logo_url = schoolLogoUrl
        }
        if (showNavbar !== initialData.show_logo_navbar) {
          before.show_logo_navbar = initialData.show_logo_navbar
          changes.show_logo_navbar = showNavbar
        }
        if (showHero !== initialData.show_logo_hero) {
          before.show_logo_hero = initialData.show_logo_hero
          changes.show_logo_hero = showHero
        }
        if (showFooter !== initialData.show_logo_footer) {
          before.show_logo_footer = initialData.show_logo_footer
          changes.show_logo_footer = showFooter
        }
        if (showAbout !== initialData.show_logo_about) {
          before.show_logo_about = initialData.show_logo_about
          changes.show_logo_about = showAbout
        }
        if (showAlumniAbout !== initialData.show_alumni_logo_about) {
          before.show_alumni_logo_about = initialData.show_alumni_logo_about
          changes.show_alumni_logo_about = showAlumniAbout
        }

        if (Object.keys(changes).length > 0) {
          console.log('Settings changed, logging activity:', changes)
          await logActivity({
            action: 'settings.update',
            targetType: 'settings',
            targetName: 'Organization Settings',
            details: {
              before: Object.keys(before).length > 0 ? before : undefined,
              after: changes
            }
          })
        }
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {success && (
        <div className="bg-blue-100 text-blue-700 p-3 rounded">
          Settings saved successfully!
        </div>
      )}

      {/* Alumni Logo */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold mb-3">Alumni Logo</h3>
        <div className="flex items-center gap-4">
          <div
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer"
            onClick={() => logoInputRef.current?.click()}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Alumni logo preview" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <span className="text-gray-400 text-sm">Logo</span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-500 mt-1">Max 5MB. PNG, JPG, SVG.</p>
            {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
          </div>
        </div>
        <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'alumni')} className="hidden" />

        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-600">Show alumni logo on:</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showNavbar} onChange={(e) => setShowNavbar(e.target.checked)} className="rounded" />
            <span className="text-sm">Navbar</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showHero} onChange={(e) => setShowHero(e.target.checked)} className="rounded" />
            <span className="text-sm">Homepage hero section</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showAlumniAbout} onChange={(e) => setShowAlumniAbout(e.target.checked)} className="rounded" />
            <span className="text-sm">About page</span>
          </label>
        </div>
      </div>

      {/* School Logo */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold mb-3">School Logo</h3>
        <div className="flex items-center gap-4">
          <div
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer"
            onClick={() => schoolLogoInputRef.current?.click()}
          >
            {schoolLogoPreview ? (
              <img src={schoolLogoPreview} alt="School logo preview" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <span className="text-gray-400 text-sm">Logo</span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => schoolLogoInputRef.current?.click()}
              disabled={uploadingSchoolLogo}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {uploadingSchoolLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-500 mt-1">Max 5MB. PNG, JPG, SVG.</p>
            {schoolLogoError && <p className="text-xs text-red-500 mt-1">{schoolLogoError}</p>}
          </div>
        </div>
        <input ref={schoolLogoInputRef} type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'school')} className="hidden" />

        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-600">Show school logo on:</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showHero} onChange={(e) => setShowHero(e.target.checked)} className="rounded" />
            <span className="text-sm">Homepage hero section</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} className="rounded" />
            <span className="text-sm">Footer (all pages)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showAbout} onChange={(e) => setShowAbout(e.target.checked)} className="rounded" />
            <span className="text-sm">About page</span>
          </label>
        </div>
      </div>

      {/* Site Branding */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold mb-3">Site Branding</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="LDSP Alumni Association"
            />
            <p className="text-xs text-gray-500 mt-1">Shown in navbar, homepage, and footer</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Connecting Lasallian alumni for a lifetime"
            />
            <p className="text-xs text-gray-500 mt-1">Shown below the title on homepage</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <div className="flex items-center gap-3">
              <select
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="border rounded px-3 py-2"
              >
                {colorChoices.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <div
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Main theme color for buttons, navbar, and accents</p>
          </div>
        </div>
      </div>

      {/* Mission */}
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

      {/* Vision */}
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

      {/* About */}
      <div>
        <label className="block text-sm font-medium mb-1">About (Additional Info)</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Activity Log Settings */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Activity Log Settings</h3>
        <div>
          <label className="block text-sm font-medium mb-1">
            Log Retention (years, 0 = forever)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={logRetentionYears}
            onChange={(e) => setLogRetentionYears(parseInt(e.target.value) || 0)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
