export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Authentication Error</h1>
          <p className="text-sm text-gray-600">
            There was an error confirming your account. Please try signing up again or contact support.
          </p>
        </div>
        <div className="text-center">
          <a href="/auth/sign-up" className="text-blue-600 hover:underline text-sm">
            Back to Sign Up
          </a>
        </div>
      </div>
    </div>
  )
}
