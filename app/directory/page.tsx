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

  const applySearch = (query: any) => {
    if (search) {
      return query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }
    return query
  }

  let members: any[] = []

  if (role === 'teacher') {
    // Teachers only — sorted by name
    let query = supabase
      .from('users')
      .select('*')
      .eq('status', 'approved')
      .eq('role', 'teacher')
      .order('last_name', { ascending: true })
    query = applySearch(query)
    const { data } = await query
    members = data || []
  } else if (role === 'alumni') {
    // Alumni only — sorted by batch, then name
    let query = supabase
      .from('users')
      .select('*')
      .eq('status', 'approved')
      .eq('role', 'alumni')
      .order('batch_year', { ascending: true })
      .order('last_name', { ascending: true })
    query = applySearch(query)
    if (batch) {
      query = query.eq('batch_year', parseInt(batch))
    }
    const { data } = await query
    members = data || []
  } else {
    // All — alumni first (sorted by batch), then teachers (sorted by name)
    let alumniQuery = supabase
      .from('users')
      .select('*')
      .eq('status', 'approved')
      .eq('role', 'alumni')
      .order('batch_year', { ascending: true })
      .order('last_name', { ascending: true })
    alumniQuery = applySearch(alumniQuery)
    if (batch) {
      alumniQuery = alumniQuery.eq('batch_year', parseInt(batch))
    }

    let teacherQuery = supabase
      .from('users')
      .select('*')
      .eq('status', 'approved')
      .eq('role', 'teacher')
      .order('last_name', { ascending: true })
    teacherQuery = applySearch(teacherQuery)

    const [alumniResult, teacherResult] = await Promise.all([alumniQuery, teacherQuery])
    // Only include teachers when no batch filter (teachers have batch_year = 0)
    members = batch
      ? alumniResult.data || []
      : [...(alumniResult.data || []), ...(teacherResult.data || [])]
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Directory</h1>

        <SearchFilter />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.length > 0 ? (
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
