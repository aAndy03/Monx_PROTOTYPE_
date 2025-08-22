import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProjectGallery } from "@/components/projects/project-gallery"

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-gray-600 mt-2">Create and manage your finance timeline projects</p>
        </div>
        <ProjectGallery />
      </div>
    </div>
  )
}
