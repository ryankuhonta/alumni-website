import { createClient } from '@/lib/supabase/server'
import AlumniCard from '@/components/directory/AlumniCard'
import SearchFilter from '@/components/directory/SearchFilter'

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const batch = typeof params.batch === 'string' ? params.batch : ''

  let query = supabase
    .from('users')
    .select('*')
    .eq('status', 'approved')
    .order('batch_year', { ascending: true })
    .order('last_name', { ascending: true })

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }

  if (batch) {
    query = query.eq('batch_year', parseInt(batch))
  }

  const { data: alumni } = await query

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Alumni Directory</h1>

        <SearchFilter />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alumni && alumni.length > 0 ? (
            alumni.map((user) => (
              <AlumniCard key={user.id} user={user} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full">
              No alumni found.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
