'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('status')
        .eq('id', user.id)
        .single()

      if (profile?.status === 'rejected') {
        await supabase.auth.signOut()
        setError('Your account has been rejected. Please contact the admin.')
        setLoading(false)
        return
      }

      if (profile?.status === 'banned') {
        await supabase.auth.signOut()
        setError('Your account has been banned. Please contact the admin.')
        setLoading(false)
        return
      }
    }

    router.push('/directory')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white py-2 rounded disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="text-center text-sm">
        <a href="/forgot-password" className="hover:underline" style={{ color: 'var(--primary-color)' }}>
          Forgot password?
        </a>
      </p>
    </form>
  )
}
