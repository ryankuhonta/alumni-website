'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import UnreadBadge from '@/components/messages/UnreadBadge'
import UnreadAnnouncementsBadge from '@/components/announcements/UnreadAnnouncementsBadge'
import UnreadJobsBadge from '@/components/jobs/UnreadJobsBadge'

interface NavbarProps {
  siteName: string
}

export default function Navbar({ siteName }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [showLogo, setShowLogo] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

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
        setIsAdmin(data?.role === 'admin' || data?.role === 'moderator')
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
          setIsAdmin(data?.role === 'admin' || data?.role === 'moderator')
        } else {
          setIsAdmin(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    router.push('/')
  }

  return (
    <nav style={{ backgroundColor: 'var(--primary-color)' }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {showLogo && logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
            ) : (
              <span className="text-xl font-bold">{siteName}</span>
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/about">About</Link>
            {user && <Link href="/directory">Directory</Link>}
            <Link href="/events">Events</Link>
            <Link href="/announcements" className="relative">
              Announcements
              {user && <UnreadAnnouncementsBadge />}
            </Link>
            {user && (
              <div className="relative">
                <Link href="/jobs">Alumni Network</Link>
                <UnreadJobsBadge />
              </div>
            )}
            {user && (
              <div className="relative">
                <Link href="/messages">Messages</Link>
                <UnreadBadge />
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="hover:underline">
                  Profile
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
                <Link href="/register" className="bg-white px-4 py-2 rounded hover:bg-gray-100" style={{ color: 'var(--primary-color)' }}>
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Hamburger button (mobile only) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="md:hidden p-2 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            <Link href="/about" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
              About
            </Link>
            {user && (
              <Link href="/directory" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
                Directory
              </Link>
            )}
            <Link href="/events" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
              Events
            </Link>
            <Link href="/announcements" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
              Announcements {user && <UnreadAnnouncementsBadge />}
            </Link>
            {user && (
              <Link href="/jobs" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
                Alumni Network <UnreadJobsBadge />
              </Link>
            )}
            {user && (
              <Link href="/messages" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
                Messages <UnreadBadge />
              </Link>
            )}
            <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
                      Admin
                    </Link>
                  )}
                  <button onClick={() => { setMenuOpen(false); handleLogout() }} className="block w-full text-left px-2 py-2 rounded hover:bg-white/10">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-2 py-2 rounded hover:bg-white/10 font-semibold">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
