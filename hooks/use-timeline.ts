"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ZOOM_LEVELS, MIN_ZOOM, MAX_ZOOM, normalizeToLevel } from "@/lib/timeline-utils"

const HOLD_TO_BREAK_MS = 2000

export function useTimeline(projectStartDate: Date, projectEndDate: Date) {
  const [zoom, setZoom] = useState(0)
  const [focusDate, setFocusDate] = useState(() => {
    // Start at project start date, not current time
    const startDate = new Date(projectStartDate)
    startDate.setHours(0, 0, 0, 0) // Start at beginning of day
    return startDate
  })
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [isWheeling, setIsWheeling] = useState(false)

  const [verticalScrollOffset, setVerticalScrollOffset] = useState(0)
  const [isVerticalScrolling, setIsVerticalScrolling] = useState(false)

  const [minuteOffset, setMinuteOffset] = useState(0) // 0-59 minutes within current hour
  const [isInMinuteMode, setIsInMinuteMode] = useState(false)
  const [minuteZoomLevel, setMinuteZoomLevel] = useState(1) // 1 = minutes, 2 = seconds

  const [granularZoom, setGranularZoom] = useState(1) // 1-5 for hour layer granular zoom

  const containerRef = useRef<HTMLDivElement>(null)
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const verticalScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Internal hold refs
  const holdRaf = useRef<number | null>(null)
  const holdStartAt = useRef<number | null>(null)
  const [boundaryHoldDirection, setBoundaryHoldDirection] = useState<"up" | "down" | null>(null)
  const [boundaryBreakProgress, setBoundaryBreakProgress] = useState(0)

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

  const handleVerticalScroll = useCallback((delta: number) => {
    setIsVerticalScrolling(true)
    setVerticalScrollOffset((prev) => {
      // Clamp vertical scroll to reasonable bounds (-500 to 500px)
      const newOffset = Math.max(-500, Math.min(500, prev + delta))
      return newOffset
    })

    if (verticalScrollTimeoutRef.current) clearTimeout(verticalScrollTimeoutRef.current)
    verticalScrollTimeoutRef.current = setTimeout(() => {
      setIsVerticalScrolling(false)
    }, 200)
  }, [])

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

  const detectTrackpad = useCallback((e: WheelEvent) => {
    // Trackpads typically have smaller deltaY values and more frequent events
    return Math.abs(e.deltaY) < 50 && e.deltaMode === 0
  }, [])

  const handleMinuteScroll = useCallback(
    (delta: number) => {
      if (zoomLevel !== "hour") return false

      const direction = delta > 0 ? 1 : -1
      const newMinute = minuteOffset + direction

      // Handle hour transitions
      if (newMinute > 59) {
        // Scrolling forward past 59 minutes - advance to next hour
        const newFocusDate = new Date(focusDate)
        newFocusDate.setHours(newFocusDate.getHours() + 1)
        newFocusDate.setMinutes(0)

        // Check if we're crossing day boundary (would need boundary breaking)
        const currentDay = focusDate.getDate()
        const newDay = newFocusDate.getDate()

        if (newDay !== currentDay) {
          // Crossing day boundary - stop here and let boundary breaking handle it
          return true
        }

        setFocusDate(clampToProject(newFocusDate))
        setMinuteOffset(0)
      } else if (newMinute < 0) {
        // Scrolling backward past 0 minutes - go back to previous hour
        const newFocusDate = new Date(focusDate)
        newFocusDate.setHours(newFocusDate.getHours() - 1)
        newFocusDate.setMinutes(59)

        // Check if we're crossing day boundary (would need boundary breaking)
        const currentDay = focusDate.getDate()
        const newDay = newFocusDate.getDate()

        if (newDay !== currentDay) {
          // Crossing day boundary - stop here and let boundary breaking handle it
          return true
        }

        setFocusDate(clampToProject(newFocusDate))
        setMinuteOffset(59)
      } else {
        // Normal minute scrolling within the same hour
        const newFocusDate = new Date(focusDate)
        newFocusDate.setMinutes(newMinute)
        setFocusDate(clampToProject(newFocusDate))
        setMinuteOffset(newMinute)
      }

      // Enter minute mode if not already
      if (!isInMinuteMode) {
        setIsInMinuteMode(true)
      }

      return true
    },
    [zoomLevel, focusDate, minuteOffset, clampToProject, isInMinuteMode],
  )

  const zoomIntoMinutes = useCallback(() => {
    if (zoomLevel === "hour" && isInMinuteMode) {
      setMinuteZoomLevel((prev) => Math.min(2, prev + 1))
    }
  }, [zoomLevel, isInMinuteMode])

  const zoomOutOfMinutes = useCallback(() => {
    if (minuteZoomLevel > 1) {
      setMinuteZoomLevel((prev) => prev - 1)
    } else if (isInMinuteMode) {
      setIsInMinuteMode(false)
      setMinuteOffset(0)
    }
  }, [minuteZoomLevel, isInMinuteMode])

  const handleGranularZoom = useCallback(
    (delta: number) => {
      if (zoomLevel !== "hour") return false

      const zoomDirection = delta < 0 ? 1 : -1

      setGranularZoom((prev) => {
        const newZoom = Math.max(1, Math.min(5, prev + zoomDirection))

        if (newZoom <= 1 && zoomDirection < 0 && prev > 1) {
          // Trigger zoom out to day layer when reaching minimum granular zoom
          setTimeout(() => {
            setZoom((z) => Math.max(MIN_ZOOM, z - 1))
            setGranularZoom(1) // Reset granular zoom
          }, 100)
        }

        return newZoom
      })

      return true
    },
    [zoomLevel],
  )

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
        const isTrackpad = detectTrackpad(e)

        if (isTrackpad && Math.abs(e.deltaY) < 10) return

        if (zoomLevel === "hour" && handleGranularZoom(e.deltaY)) {
          return
        }

        if (dir > 0 && zoom < MAX_ZOOM) {
          setFocusDate((f) => (hoveredDate ? hoveredDate : f))
          setZoom((z) => Math.min(MAX_ZOOM, z + 1))
          setGranularZoom(1)
        } else if (dir < 0 && zoom > MIN_ZOOM) {
          setZoom((z) => Math.max(MIN_ZOOM, z - 1))
          setGranularZoom(1)
        }
      } else if (e.altKey) {
        // ALT + Scroll for vertical scrolling within units
        e.preventDefault()
        const delta = e.deltaY * 0.5 // Smooth scrolling
        handleVerticalScroll(-delta)
      } else if (e.shiftKey) {
        // Shift + Scroll for minute scrolling within units
        e.preventDefault()
        e.stopPropagation() // Prevent event bubbling
        const delta = e.deltaY
        console.log("[v0] Shift + Scroll detected, delta:", delta, "granularZoom before:", granularZoom)

        // Only handle minute scrolling, explicitly prevent any zoom changes
        if (zoomLevel === "hour") {
          const handled = handleMinuteScroll(delta)
          console.log("[v0] Minute scroll handled:", handled, "granularZoom after:", granularZoom)
        }

        // Explicitly return early to prevent any other processing
        return
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoom, hoveredDate, detectTrackpad, handleVerticalScroll, handleMinuteScroll, zoomLevel, handleGranularZoom])

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

    verticalScrollOffset,
    isVerticalScrolling,

    minuteOffset,
    isInMinuteMode,
    minuteZoomLevel,

    granularZoom,

    // boundary-break visuals
    boundaryBreakProgress,
    boundaryHoldDirection,

    // actions
    changeFocus,
    beginBoundaryHold,
    cancelBoundaryHold,
    zoomInTo,
    handleVerticalScroll,

    handleMinuteScroll,
    zoomIntoMinutes,
    zoomOutOfMinutes,
    handleGranularZoom,
  }
}
