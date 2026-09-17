'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types/database'

interface AdminSidebarProps {
  userRole: UserRole
}

const allLinks = [
  { href: '/admin', label: 'Dashboard', adminOnly: false },
  { href: '/admin/users', label: 'Users', adminOnly: false },
  { href: '/admin/events', label: 'Events', adminOnly: false },
  { href: '/admin/announcements', label: 'Announcements', adminOnly: false },
  { href: '/admin/jobs', label: 'Opportunities', adminOnly: false },
  { href: '/admin/officers', label: 'Officers', adminOnly: false },
  { href: '/admin/settings', label: 'Settings', adminOnly: true },
  { href: '/admin/activity', label: 'Activity Log', adminOnly: true },
]

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'admin'

  const links = allLinks.filter(link => !link.adminOnly || isAdmin)

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
