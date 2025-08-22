import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Finance Timeline</h1>
        <p className="text-xl text-gray-600">Multi-layered timeline interface for finance tracking</p>
        <div className="space-x-4">
          <a
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Sign In
          </a>
          <a
            href="/auth/sign-up"
            className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  )
}
