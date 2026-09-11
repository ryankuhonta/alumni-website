'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/announcements', label: 'Announcements' },
  { href: '/admin/jobs', label: 'Opportunities' },
  { href: '/admin/officers', label: 'Officers' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/activity', label: 'Activity Log' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-2 rounded ${
              pathname === link.href
                ? 'text-white'
                : 'hover:bg-gray-700'
            }`}
            style={pathname === link.href ? { backgroundColor: 'var(--primary-color)' } : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
