"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium rounded-lg"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
    }
  }, [state, router])

  return (
    <div className="w-full max-w-md space-y-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-600">Sign in to your account</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{state.error}</div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required className="w-full" />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input id="password" name="password" type="password" required className="w-full" />
          </div>
        </div>

        <SubmitButton />

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  )
}
