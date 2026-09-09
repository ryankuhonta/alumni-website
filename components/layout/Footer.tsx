import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Footer() {
  const supabase = await createClient()

  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('school_logo_url, show_logo_footer')
    .limit(1)
    .single()

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold mb-4">LDSP Alumni Association</h3>
            <p className="text-gray-400 text-sm">
              Connecting Lasallian alumni for a lifetime.
            </p>
            {orgInfo?.show_logo_footer && orgInfo?.school_logo_url && (
              <img
                src={orgInfo.school_logo_url}
                alt="Liceo de San Pedro Logo"
                className="h-16 mt-4 object-contain"
              />
            )}
          </div>
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/directory" className="hover:text-white">Directory</Link></li>
              <li><Link href="/events" className="hover:text-white">Events</Link></li>
              <li><Link href="/jobs" className="hover:text-white">Job Board</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Connect</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white">Facebook</a></li>
              <li><a href="#" className="hover:text-white">Instagram</a></li>
              <li><a href="#" className="hover:text-white">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} LDSP Alumni Association. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
