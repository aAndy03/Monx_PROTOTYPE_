"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Clock } from "lucide-react"
import { CreateProjectModal } from "./create-project-modal"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  created_at: string
}

export function ProjectGallery() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    fetchProjects()
    setShowCreateModal(false)
  }

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Project Card */}
        <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
          <CardContent
            className="flex flex-col items-center justify-center h-48 text-gray-500 hover:text-blue-600"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium">Create New Project</h3>
            <p className="text-sm text-center">Start a new finance timeline</p>
          </CardContent>
        </Card>

        {/* Existing Projects */}
        {projects.map((project) => (
          <Link key={project.id} href={`/project/${project.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                {project.description && <CardDescription>{project.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(project.start_date).toLocaleDateString()} -{" "}
                      {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  )
}
