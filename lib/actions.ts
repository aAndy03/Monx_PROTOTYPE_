"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  if (!email || !password || !fullName) {
    return { error: "All fields are required" }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      // Check if it's a database-related error
      if (error.message.includes("relation") || error.message.includes("table") || error.message.includes("function")) {
        return { error: "Database not initialized. Please run the database setup script first." }
      }
      return { error: error.message }
    }

    return { success: true, message: "Check your email to confirm your account" }
  } catch (err) {
    console.error("Signup error:", err)
    return { error: "Database not initialized. Please run the database setup script first." }
  }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
