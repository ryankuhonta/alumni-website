import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">
          Login to Your Account
        </h1>
        <LoginForm />
        <p className="text-center mt-4 text-gray-600">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-700 hover:underline">
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}
