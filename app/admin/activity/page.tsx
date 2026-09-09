import { createClient } from '@/lib/supabase/server'
import ActivityLogTable from '@/components/admin/ActivityLogTable'
import CleanupButton from '@/components/admin/CleanupButton'

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const actionFilter = typeof params.action === 'string' ? params.action : ''

  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (actionFilter) {
    query = query.eq('action', actionFilter)
  }

  const { data: logs } = await query

  const { data: actions } = await supabase
    .from('activity_logs')
    .select('action')
    .order('action')

  const uniqueActions = [...new Set((actions || []).map(l => l.action))].sort()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <a 
          href="/admin/activity"
          className={`px-3 py-1 rounded text-sm ${!actionFilter ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
        >
          All
        </a>
        {uniqueActions.map((action) => (
          <a
            key={action}
            href={`/admin/activity?action=${action}`}
            className={`px-3 py-1 rounded text-sm ${actionFilter === action ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
          >
            {action.split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </a>
        ))}
        <div className="ml-auto">
          <CleanupButton />
        </div>
      </div>

      {logs && logs.length > 0 ? (
        <ActivityLogTable logs={logs} />
      ) : (
        <p className="text-gray-500">No activity logs yet.</p>
      )}
    </div>
  )
}