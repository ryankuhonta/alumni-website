'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [showLogo, setShowLogo] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.role === 'admin')
      } else {
        setIsAdmin(false)
      }
    }

    const fetchLogo = async () => {
      const { data } = await supabase
        .from('organization_info')
        .select('logo_url, show_logo_navbar')
        .limit(1)
        .single()
      if (data?.logo_url) setLogoUrl(data.logo_url)
      if (data?.show_logo_navbar !== undefined) setShowLogo(data.show_logo_navbar)
    }

    fetchUser()
    fetchLogo()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()
          setIsAdmin(data?.role === 'admin')
        } else {
          setIsAdmin(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    router.push('/')
  }

  return (
    <nav className="bg-[#0d1b2a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {showLogo && logoUrl ? (
              <img src={logoUrl} alt="LDSP Alumni Logo" className="h-10 w-auto" />
            ) : (
              <span className="text-xl font-bold">LDSP Alumni</span>
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/about">About</Link>
            <Link href="/directory">Directory</Link>
            <Link href="/events">Events</Link>
            <Link href="/announcements">Announcements</Link>
            <Link href="/jobs">Jobs</Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="hover:underline">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="hover:underline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:underline">
                  Login
                </Link>
                <Link href="/register" className="bg-white text-[#0d1b2a] px-4 py-2 rounded hover:bg-gray-100">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
