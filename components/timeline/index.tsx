"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useTimeline } from "@/hooks/use-timeline"
import { YearLayer } from "./layers/year-layer"
import { MonthLayer } from "./layers/month-layer"
import { WeekLayer } from "./layers/week-layer"
import { DayLayer } from "./layers/day-layer"
import { HourLayer } from "./layers/hour-layer"
import { TimelineNavbar } from "./timeline-navbar"
import { RealTimeClock } from "./real-time-clock"

interface TimelineProps {
  projectStartDate: Date
  projectEndDate: Date
}

export function Timeline({ projectStartDate, projectEndDate }: TimelineProps) {
  const timeline = useTimeline(projectStartDate, projectEndDate)

  const renderLayer = () => {
    const layerProps = {
      ...timeline,
      verticalScrollOffset: timeline.verticalScrollOffset,
      isVerticalScrolling: timeline.isVerticalScrolling,
    }

    switch (timeline.zoomLevel) {
      case "year":
        return <YearLayer key="year" {...layerProps} />
      case "month":
        return <MonthLayer key="month" {...layerProps} />
      case "week":
        return <WeekLayer key="week" {...layerProps} />
      case "day":
        return <DayLayer key="day" {...layerProps} />
      case "hour":
        return <HourLayer key="hour" {...layerProps} />
      default:
        return null
    }
  }

  return (
    <div
      ref={timeline.containerRef}
      className="w-full h-full flex items-center justify-center select-none cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <div
        className="w-full h-full relative flex items-center justify-center perspective-1000 pt-20"
        style={{
          transform: `translateY(${timeline.verticalScrollOffset}px)`,
          transition: timeline.isVerticalScrolling ? "none" : "transform 0.3s ease-out",
        }}
      >
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

      <TimelineNavbar
        focusDate={timeline.focusDate}
        zoomLevel={timeline.zoomLevel}
        onDateChange={timeline.changeFocus}
        projectStartDate={projectStartDate}
        projectEndDate={projectEndDate}
        isInMinuteMode={timeline.isInMinuteMode}
        minuteZoomLevel={timeline.minuteZoomLevel}
        minuteOffset={timeline.minuteOffset}
      />

      <RealTimeClock />

      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground pointer-events-none">
        <p>Ctrl + Scroll to Zoom</p>
        <p>Scroll to Navigate Time</p>
        <p>Alt + Scroll to View Content</p>
        <p>Shift + Scroll for Minutes (Hour layer only)</p>
        <p>T to Add Transaction (Hour layer only)</p>
        <p>Drag and hold at an edge for 2s to break boundaries</p>
      </div>
    </div>
  )
}
