import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardForm from '@/components/dashboard/DashboardForm'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

        {profile && <DashboardForm profile={profile} />}
      </div>
    </div>
  )
}
