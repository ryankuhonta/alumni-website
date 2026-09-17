import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/admin')

  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('*')
    .single()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>
      <SettingsForm initialData={orgInfo} />
    </div>
  )
}
