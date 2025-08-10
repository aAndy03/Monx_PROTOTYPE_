import { Timeline } from "@/components/timeline"

export default function Home() {
  // Project-specific configuration
  const projectStartDate = new Date("2020-01-01")
  const projectEndDate = new Date("2030-12-31")

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
      <div className="w-full h-screen relative">
        <Timeline projectStartDate={projectStartDate} projectEndDate={projectEndDate} />
      </div>
    </main>
  )
}
