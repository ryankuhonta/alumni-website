import { createClient } from '@/lib/supabase/server'
import AlumniCard from '@/components/directory/AlumniCard'
import SearchFilter from '@/components/directory/SearchFilter'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Directory',
  description: 'Browse and connect with fellow LDSP alumni and teachers. Find classmates and faculty members.',
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const batch = typeof params.batch === 'string' ? params.batch : ''
  const role = typeof params.role === 'string' ? params.role : ''

  let query = supabase
    .from('users')
    .select('*')
    .eq('status', 'approved')
    .order('role')
    .order('batch_year', { ascending: true })
    .order('last_name', { ascending: true })

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }

  if (batch && role !== 'teacher') {
    query = query.eq('batch_year', parseInt(batch))
  }

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  const { data: members } = await query

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Directory</h1>

        <SearchFilter />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members && members.length > 0 ? (
            members.map((user) => (
              <AlumniCard key={user.id} user={user} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full">
              No members found.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
