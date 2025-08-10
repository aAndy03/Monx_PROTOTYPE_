"use client"

import { useRef, useEffect, useMemo, useState, type ReactNode } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { format } from "date-fns"
import { TimelineItem } from "../timeline-item"
import type { ZoomLevel } from "@/lib/timeline-utils"
import { sameUnit } from "@/lib/timeline-utils"
import { EdgeHandle } from "../edge-handle"

interface AbstractLayerProps {
  zoomLevel: ZoomLevel
  items: Date[]
  itemFormat: string
  focusDate: Date
  isWheeling: boolean
  setHoveredDate: (d: Date | null) => void
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
}

export function AbstractLayer({
  zoomLevel,
  items,
  itemFormat,
  focusDate,
  isWheeling,
  setHoveredDate,
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

  const focusIndex = useMemo(() => {
    const idx = items.findIndex((d) => sameUnit(zoomLevel, d, focusDate))
    return Math.max(0, idx)
  }, [items, focusDate, zoomLevel])

  // Center selected item
  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth
      const itemWidth = Math.min(280, Math.max(160, width / 6)) // responsive width
      const targetX = width / 2 - focusIndex * itemWidth - itemWidth / 2
      x.set(targetX)
    }
  }, [focusIndex, items.length, x])

  // Wheel to step within bounds
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // zoom handled globally
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
      <motion.div ref={containerRef} className="w-full h-full flex items-center" style={{ x: springX }}>
        {items.map((item, index) => {
          const isCenter = index === focusIndex
          const distance = Math.abs(index - focusIndex)
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
            />
          )
          const node = renderItem ? renderItem({ date: item, index, isCenter, distance, defaultNode }) : defaultNode

          return (
            <div
              key={item.toISOString()}
              className="flex-shrink-0 w-[16.66vw] min-w-[160px] max-w-[280px]"
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
        onBeginHold={(dir) => beginBoundaryHold(dir, completeLeft)}
        onCancelHold={cancelBoundaryHold}
        onCompleteHold={() => {}}
      />
      <EdgeHandle
        side="right"
        active={atEnd}
        holding={rightHolding}
        progress={rightHolding ? boundaryBreakProgress : 0}
        onBeginHold={(dir) => beginBoundaryHold(dir, completeRight)}
        onCancelHold={cancelBoundaryHold}
        onCompleteHold={() => {}}
      />
    </div>
  )
}
