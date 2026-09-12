'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toTitleCase, PREDEFINED_LOCATIONS } from '@/lib/utils'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [batchYear, setBatchYear] = useState('')
  const [currentCompany, setCurrentCompany] = useState('')
  const [location, setLocation] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          setError('Account created but login failed. Please check your email to confirm, then log in.')
          setLoading(false)
          return
        }
      }

      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        first_name: toTitleCase(firstName),
        last_name: toTitleCase(lastName),
        batch_year: parseInt(batchYear),
        current_company: currentCompany || null,
        location: location || null,
        mobile_number: mobileNumber || null,
        job_title: jobTitle || null,
        facebook_url: facebookUrl || null,
        linkedin_url: linkedinUrl || null,
        role: 'alumni',
        status: 'approved',
      })

      if (profileError) {
        console.error('Profile insert error:', profileError)
        setError(`Failed to create profile: ${profileError.message}`)
        setLoading(false)
        return
      }

      router.push('/directory')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">First Name *</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Last Name *</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password *</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Batch Year *</label>
        <input
          type="number"
          value={batchYear}
          onChange={(e) => setBatchYear(e.target.value)}
          required
          min="1990"
          max={new Date().getFullYear().toString()}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Current Company</label>
        <input
          type="text"
          value={currentCompany}
          onChange={(e) => setCurrentCompany(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select location</option>
          {PREDEFINED_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mobile Number</label>
        <input
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="09XX XXX XXXX"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Job Title</label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g., Software Engineer"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Facebook URL</label>
        <input
          type="url"
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
          placeholder="https://facebook.com/yourprofile"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/yourprofile"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white py-2 rounded disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
}
