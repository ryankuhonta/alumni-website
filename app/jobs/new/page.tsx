import JobForm from '@/components/jobs/JobForm'

export default function NewJobPage() {
  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Post an Opportunity</h1>
        <JobForm />
      </div>
    </div>
  )
}
