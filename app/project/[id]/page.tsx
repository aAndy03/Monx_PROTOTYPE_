import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Timeline } from "@/components/timeline"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get project details
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !project) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="w-full h-screen relative">
        <Timeline
          projectId={project.id}
          projectStartDate={new Date(project.start_date)}
          projectEndDate={new Date(project.end_date)}
          project={project}
        />
      </div>
    </div>
  )
}
