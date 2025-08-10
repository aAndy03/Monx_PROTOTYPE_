"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ZOOM_LEVELS, MIN_ZOOM, MAX_ZOOM, normalizeToLevel } from "@/lib/timeline-utils"

const HOLD_TO_BREAK_MS = 2000

export function useTimeline(projectStartDate: Date, projectEndDate: Date) {
  const [zoom, setZoom] = useState(0)
  const [focusDate, setFocusDate] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [isWheeling, setIsWheeling] = useState(false)

  // Boundary break state
  const [boundaryBreakProgress, setBoundaryBreakProgress] = useState(0)
  const [boundaryHoldDirection, setBoundaryHoldDirection] = useState<"up" | "down" | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Internal hold refs
  const holdRaf = useRef<number | null>(null)
  const holdStartAt = useRef<number | null>(null)

  const zoomLevel = ZOOM_LEVELS[Math.floor(zoom)]

  const clampToProject = useCallback(
    (d: Date) => {
      if (d < projectStartDate) return projectStartDate
      if (d > projectEndDate) return projectEndDate
      return d
    },
    [projectStartDate, projectEndDate],
  )

  const changeFocus = useCallback(
    (newDate: Date) => {
      const normalized = normalizeToLevel(zoomLevel, newDate)
      setFocusDate(clampToProject(normalized))
    },
    [zoomLevel, clampToProject],
  )

  // Zoom into the next deeper layer, focusing on the provided date
  const zoomInTo = useCallback(
    (d: Date) => {
      setZoom((prev) => {
        const nextIndex = Math.min(MAX_ZOOM, Math.floor(prev) + 1)
        const targetLevel = ZOOM_LEVELS[nextIndex]
        const normalized = normalizeToLevel(targetLevel, d)
        setFocusDate(clampToProject(normalized))
        return nextIndex
      })
    },
    [clampToProject],
  )

  // Hold-to-break controls
  const cancelBoundaryHold = useCallback(() => {
    if (holdRaf.current) cancelAnimationFrame(holdRaf.current)
    holdRaf.current = null
    holdStartAt.current = null
    setBoundaryHoldDirection(null)
    setBoundaryBreakProgress(0)
  }, [])

  const beginBoundaryHold = useCallback(
    (direction: "up" | "down", onComplete: () => void) => {
      // If switching directions mid-hold, reset
      if (boundaryHoldDirection && boundaryHoldDirection !== direction) {
        cancelBoundaryHold()
      }
      if (!holdStartAt.current) {
        setBoundaryHoldDirection(direction)
        holdStartAt.current = performance.now()
        const tick = () => {
          if (!holdStartAt.current) return
          const elapsed = performance.now() - holdStartAt.current
          const progress = Math.min(elapsed / HOLD_TO_BREAK_MS, 1)
          setBoundaryBreakProgress(progress)
          if (progress >= 1) {
            cancelBoundaryHold()
            onComplete()
            return
          }
          holdRaf.current = requestAnimationFrame(tick)
        }
        holdRaf.current = requestAnimationFrame(tick)
      }
    },
    [boundaryHoldDirection, cancelBoundaryHold],
  )

  // Zoom controls (Ctrl + wheel), prevent page zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setIsWheeling(true)
        if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current)
        wheelTimeoutRef.current = setTimeout(() => setIsWheeling(false), 200)

        const dir = e.deltaY < 0 ? 1 : -1
        if (dir > 0 && zoom < MAX_ZOOM) {
          setFocusDate((f) => (hoveredDate ? hoveredDate : f))
          setZoom((z) => Math.min(MAX_ZOOM, z + 1))
        } else if (dir < 0 && zoom > MIN_ZOOM) {
          setZoom((z) => Math.max(MIN_ZOOM, z - 1))
        }
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoom, hoveredDate])

  return {
    // state
    containerRef,
    zoom,
    zoomLevel,
    focusDate,
    isWheeling,
    setHoveredDate,
    projectStartDate,
    projectEndDate,

    // boundary-break visuals
    boundaryBreakProgress,
    boundaryHoldDirection,

    // actions
    changeFocus,
    beginBoundaryHold,
    cancelBoundaryHold,
    zoomInTo,
  }
}
