import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

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
