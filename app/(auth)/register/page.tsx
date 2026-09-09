import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Create Your Account
        </h1>
        <RegisterForm />
        <p className="text-center mt-4 text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="hover:underline" style={{ color: 'var(--primary-color)' }}>
            Login here
          </a>
        </p>
      </div>
    </div>
  )
}
