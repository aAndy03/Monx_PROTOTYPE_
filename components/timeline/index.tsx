"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useTimeline } from "@/hooks/use-timeline"
import { format } from "date-fns"
import { BoundaryBreakIndicator } from "./boundary-break-indicator"
import { YearLayer } from "./layers/year-layer"
import { MonthLayer } from "./layers/month-layer"
import { WeekLayer } from "./layers/week-layer"
import { DayLayer } from "./layers/day-layer"
import { HourLayer } from "./layers/hour-layer"

interface TimelineProps {
  projectStartDate: Date
  projectEndDate: Date
}

export function Timeline({ projectStartDate, projectEndDate }: TimelineProps) {
  const timeline = useTimeline(projectStartDate, projectEndDate)

  const renderLayer = () => {
    switch (timeline.zoomLevel) {
      case "year":
        return <YearLayer key="year" {...timeline} />
      case "month":
        return <MonthLayer key="month" {...timeline} />
      case "week":
        return <WeekLayer key="week" {...timeline} />
      case "day":
        return <DayLayer key="day" {...timeline} />
      case "hour":
        return <HourLayer key="hour" {...timeline} />
      default:
        return null
    }
  }

  return (
    <div
      ref={timeline.containerRef}
      className="w-full h-full flex items-center justify-center select-none cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <div className="w-full h-full relative flex items-center justify-center perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={timeline.zoomLevel}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full h-full absolute inset-0 flex items-center justify-center"
          >
            {renderLayer()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-4 pointer-events-none">
        <BoundaryBreakIndicator progress={timeline.boundaryBreakProgress} />
        <div className="bg-card p-2 rounded-lg shadow-lg text-xs text-muted-foreground">
          <p>Zoom: {timeline.zoom.toFixed(2)}</p>
          <p>Level: {timeline.zoomLevel}</p>
          <p>Date: {format(timeline.focusDate, "yyyy-MM-dd HH:mm")}</p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground pointer-events-none">
        <p>Ctrl + Scroll to Zoom</p>
        <p>Scroll to Navigate Time</p>
        <p>Drag and hold at an edge for 2s to break boundaries</p>
      </div>
    </div>
  )
}
