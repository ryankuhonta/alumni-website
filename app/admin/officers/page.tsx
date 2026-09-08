import { createClient } from '@/lib/supabase/server'

export default async function AdminOfficersPage() {
  const supabase = await createClient()

  const { data: officers } = await supabase
    .from('officers')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Officers</h1>

      {officers && officers.length > 0 ? (
        <div className="space-y-4">
          {officers.map((officer) => (
            <div key={officer.id} className="border rounded p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">{officer.name}</h3>
                <p className="text-sm text-gray-500">
                  {officer.position}
                  {officer.term_year && ` · ${officer.term_year}`}
                </p>
              </div>
              <div className="space-x-2">
                <button className="text-green-700 hover:underline">Edit</button>
                <button className="text-red-700 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No officers yet.</p>
      )}
    </div>
  )
}
