'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const supabase = createClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Forgot Password
        </h1>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-100 text-green-700 p-3 rounded">
              Check your email for a password reset link.
            </div>
            <p className="text-center text-sm text-gray-600">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="hover:underline"
                style={{ color: 'var(--primary-color)' }}
              >
                try again
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
            )}

            <p className="text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2 rounded disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center mt-4 text-gray-600">
          Remember your password?{' '}
          <a href="/login" className="hover:underline" style={{ color: 'var(--primary-color)' }}>
            Login here
          </a>
        </p>
      </div>
    </div>
  )
}
