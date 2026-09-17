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

  // Check poster's role
  let posterRole = 'alumni'
  if (job.posted_by && job.posted_by !== user.id) {
    const { data: poster } = await supabase
      .from('users')
      .select('role')
      .eq('id', job.posted_by)
      .single()
    posterRole = poster?.role || 'alumni'
  }

  const isOwner = job.posted_by === user.id
  const isAdmin = profile?.role === 'admin'
  const isModerator = profile?.role === 'moderator'

  // Alumni: only own posts
  // Moderator: own posts + alumni posts (not admin posts)
  // Admin: all
  const canEdit = isOwner || isAdmin || (isModerator && posterRole !== 'admin')

  if (!canEdit) {
    redirect('/jobs')
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Edit Post</h1>
        <JobForm initialData={job} />
      </div>
    </div>
  )
}
