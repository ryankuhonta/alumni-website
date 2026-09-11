import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface FooterProps {
  siteName: string
}

export default async function Footer({ siteName }: FooterProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('school_logo_url, show_logo_footer, facebook_url, instagram_url, linkedin_url, show_facebook, show_instagram, show_linkedin, tagline')
    .limit(1)
    .single()

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold mb-4">{siteName}</h3>
            <p className="text-gray-400 text-sm">
              {orgInfo?.tagline || 'Connecting Lasallian alumni for a lifetime.'}
            </p>
            {orgInfo?.show_logo_footer && orgInfo?.school_logo_url && (
              <img
                src={orgInfo.school_logo_url}
                alt="School Logo"
                className="h-24 mt-4 object-contain"
              />
            )}
          </div>
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              {user && <li><Link href="/directory" className="hover:text-white">Directory</Link></li>}
              <li><Link href="/events" className="hover:text-white">Events</Link></li>
              {user && <li><Link href="/jobs" className="hover:text-white">Opportunities</Link></li>}
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Connect</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              {orgInfo?.show_facebook && orgInfo?.facebook_url && (
                <li><a href={orgInfo.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a></li>
              )}
              {orgInfo?.show_instagram && orgInfo?.instagram_url && (
                <li><a href={orgInfo.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
              )}
              {orgInfo?.show_linkedin && orgInfo?.linkedin_url && (
                <li><a href={orgInfo.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">LinkedIn</a></li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
