"use client"

import { useRef, useEffect, useMemo, useState, type ReactNode } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import {
  format,
  addYears,
  subYears,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addHours,
  subHours,
} from "date-fns"
import { TimelineItem } from "../timeline-item"
import type { ZoomLevel } from "@/lib/timeline-utils"
import { sameUnit, normalizeToLevel } from "@/lib/timeline-utils"
import { EdgeHandle } from "../edge-handle"

interface AbstractLayerProps {
  zoomLevel: ZoomLevel
  items: Date[]
  itemFormat: string
  focusDate: Date
  isWheeling: boolean
  setHoveredDate: (d: Date | null) => void
  verticalScrollOffset?: number
  isVerticalScrolling?: boolean
  // one-step scroll inside current bounded list
  onScrollStep: (delta: 1 | -1) => boolean
  // drag-hold boundary dissolve
  beginBoundaryHold: (direction: "up" | "down", onDone: () => void) => void
  cancelBoundaryHold: () => void
  onBoundaryBreak: (direction: "up" | "down") => void
  // click to zoom deeper
  onZoomIn: (d: Date) => void
  // visuals (progress ring, hold direction)
  boundaryBreakProgress?: number
  boundaryHoldDirection?: "up" | "down" | null
  // custom item renderer for layer-specific UI (optional)
  renderItem?: (args: {
    date: Date
    index: number
    isCenter: boolean
    distance: number
    defaultNode: ReactNode
  }) => ReactNode
  granularZoom?: number
  itemWidth?: number
}

export function AbstractLayer({
  zoomLevel,
  items,
  itemFormat,
  focusDate,
  isWheeling,
  setHoveredDate,
  verticalScrollOffset = 0,
  isVerticalScrolling = false,
  granularZoom = 1,
  itemWidth, // Added itemWidth parameter
  onScrollStep,
  beginBoundaryHold,
  cancelBoundaryHold,
  onBoundaryBreak,
  onZoomIn,
  boundaryBreakProgress = 0,
  boundaryHoldDirection = null,
  renderItem,
}: AbstractLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 50 })
  const [flashSide, setFlashSide] = useState<"left" | "right" | null>(null)
  const [viewportWidth, setViewportWidth] = useState(0)

  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth)
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  const focusIndex = useMemo(() => {
    const normalizedFocus = normalizeToLevel(zoomLevel, focusDate)
    const idx = items.findIndex((d) => sameUnit(zoomLevel, d, normalizedFocus))

    if (idx >= 0) return idx

    // For hour layer, use the hour value as fallback
    if (zoomLevel === "hour") {
      const targetHour = normalizedFocus.getHours()
      return Math.min(Math.max(0, targetHour), items.length - 1)
    }

    // For other layers, default to 0
    return 0
  }, [items, focusDate, zoomLevel])

  const getPreviewText = (direction: "up" | "down") => {
    const currentDate = focusDate
    let nextDate: Date

    switch (zoomLevel) {
      case "year":
        nextDate = direction === "up" ? subYears(currentDate, 1) : addYears(currentDate, 1)
        return format(nextDate, "yyyy")
      case "month":
        nextDate = direction === "up" ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
        return format(nextDate, "MMM yyyy")
      case "week":
        nextDate = direction === "up" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1)
        return `Week of ${format(nextDate, "MMM d")}`
      case "day":
        nextDate = direction === "up" ? subDays(currentDate, 1) : addDays(currentDate, 1)
        return format(nextDate, "MMM d, yyyy")
      case "hour":
        nextDate = direction === "up" ? subHours(currentDate, 1) : addHours(currentDate, 1)
        return format(nextDate, "HH:mm")
      default:
        return "Next period"
    }
  }

  useEffect(() => {
    if (containerRef.current && viewportWidth > 0) {
      // Use viewport width for accurate centering
      const width = viewportWidth
      const baseItemWidth = Math.min(320, Math.max(200, width / 5))
      const scaledItemWidth = itemWidth || (zoomLevel === "hour" ? baseItemWidth * granularZoom : baseItemWidth)

      // Calculate the total width of all items
      const totalItemsWidth = items.length * scaledItemWidth

      // Calculate the starting position to center the focused item in viewport
      const viewportCenter = width / 2
      const focusedItemCenter = focusIndex * scaledItemWidth + scaledItemWidth / 2

      let minuteAdjustment = 0
      if (zoomLevel === "hour" && granularZoom > 1) {
        // Calculate minute progress within the current hour
        const minuteProgress = (focusDate.getMinutes() || 0) / 60
        const spaceBetweenHours = scaledItemWidth - baseItemWidth
        minuteAdjustment = minuteProgress * spaceBetweenHours
      }

      // Position the container so the focused item (with minute adjustment) is at viewport center
      const targetX = viewportCenter - focusedItemCenter - minuteAdjustment

      x.set(targetX)
    }
  }, [focusIndex, items.length, x, zoomLevel, granularZoom, viewportWidth, itemWidth, focusDate]) // Added focusDate to dependencies

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.altKey) return // zoom and vertical scroll handled globally
      e.preventDefault()
      const delta: 1 | -1 = e.deltaY > 0 ? 1 : -1
      onScrollStep(delta)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [onScrollStep])

  // Drag-hold helpers
  const atStart = focusIndex === 0
  const atEnd = focusIndex === items.length - 1
  const leftHolding = boundaryHoldDirection === "up" && atStart
  const rightHolding = boundaryHoldDirection === "down" && atEnd

  const completeLeft = () => {
    setFlashSide("left")
    onBoundaryBreak("up")
    setTimeout(() => setFlashSide(null), 300)
  }
  const completeRight = () => {
    setFlashSide("right")
    onBoundaryBreak("down")
    setTimeout(() => setFlashSide(null), 300)
  }

  return (
    <div className="relative w-full h-full">
      {flashSide && (
        <motion.div
          className={`pointer-events-none absolute top-0 bottom-0 w-24 ${
            flashSide === "left" ? "left-0" : "right-0"
          } bg-primary/20`}
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      )}

      {/* Track */}
      <motion.div ref={containerRef} className="w-full h-full flex items-center justify-start" style={{ x: springX }}>
        {items.map((item, index) => {
          const isCenter = index === focusIndex
          const distance = Math.abs(index - focusIndex)

          const baseWidth = Math.min(320, Math.max(200, viewportWidth > 0 ? viewportWidth / 5 : 250))
          const finalItemWidth = itemWidth || (zoomLevel === "hour" ? baseWidth * granularZoom : baseWidth)

          const defaultNode = (
            <TimelineItem
              itemDate={item}
              formatStr={format(item, itemFormat)}
              isCenter={isCenter}
              isWheeling={isWheeling}
              distance={distance}
              zoomLevel={zoomLevel}
              onMouseEnter={() => setHoveredDate(item)}
              onMouseLeave={() => setHoveredDate(null)}
              verticalScrollOffset={verticalScrollOffset}
              isVerticalScrolling={isVerticalScrolling}
            />
          )
          const node = renderItem ? renderItem({ date: item, index, isCenter, distance, defaultNode }) : defaultNode

          return (
            <div
              key={item.toISOString()}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: `${finalItemWidth}px`, // Use finalItemWidth instead of itemWidth variable
                minWidth: "200px",
              }}
              onClick={() => onZoomIn(item)}
            >
              {node}
            </div>
          )
        })}
      </motion.div>

      {/* Interactive edge handles */}
      <EdgeHandle
        side="left"
        active={atStart}
        holding={leftHolding}
        progress={leftHolding ? boundaryBreakProgress : 0}
        previewText={atStart ? getPreviewText("up") : undefined}
        onBeginHold={(dir) => beginBoundaryHold(dir, completeLeft)}
        onCancelHold={cancelBoundaryHold}
        onCompleteHold={() => {}}
        containerRef={containerRef}
      />
      <EdgeHandle
        side="right"
        active={atEnd}
        holding={rightHolding}
        progress={rightHolding ? boundaryBreakProgress : 0}
        previewText={atEnd ? getPreviewText("down") : undefined}
        onBeginHold={(dir) => beginBoundaryHold(dir, completeRight)}
        onCancelHold={cancelBoundaryHold}
        onCompleteHold={() => {}}
        containerRef={containerRef}
      />
    </div>
  )
}
