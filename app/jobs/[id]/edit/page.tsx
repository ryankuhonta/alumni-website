import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import JobForm from '@/components/jobs/JobForm'

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  // Only admin or poster can edit
  const isAdmin = profile?.role === 'admin'
  const isPoster = job.posted_by === user.id

  if (!isAdmin && !isPoster) {
    redirect('/jobs')
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Edit Opportunity</h1>
        <JobForm initialData={job} />
      </div>
    </div>
  )
}
