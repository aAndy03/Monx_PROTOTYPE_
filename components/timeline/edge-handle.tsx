"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface EdgeHandleProps {
  side: "left" | "right"
  active: boolean
  holding: boolean
  progress: number // 0..1
  onBeginHold: (direction: "up" | "down") => void
  onCancelHold: () => void
  onCompleteHold: (direction: "up" | "down") => void
  previewText?: string
  containerRef: React.RefObject<HTMLDivElement>
}

const DRAG_THRESHOLD = 12
const EDGE_PROXIMITY = 100

export function EdgeHandle({
  side,
  active,
  holding,
  progress,
  onBeginHold,
  onCancelHold,
  onCompleteHold,
  previewText,
  containerRef,
}: EdgeHandleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const Icon = side === "left" ? ChevronLeft : ChevronRight
  const directionForSide: "up" | "down" = side === "left" ? "up" : "down"

  // Local drag state
  const pressed = useRef(false)
  const startedHold = useRef(false)
  const startX = useRef(0)

  useEffect(() => {
    if (!active) return

    const handleMouseMove = (e: MouseEvent) => {
      const viewportWidth = window.innerWidth
      const mouseX = e.clientX
      const mouseY = e.clientY

      setMousePosition({ x: mouseX, y: mouseY })

      let nearEdge = false
      if (side === "left") {
        nearEdge = mouseX < EDGE_PROXIMITY
      } else {
        nearEdge = mouseX > viewportWidth - EDGE_PROXIMITY
      }

      setIsVisible(nearEdge || holding)
    }

    const handleMouseLeave = () => {
      if (!holding) {
        setIsVisible(false)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [active, side, holding])

  useEffect(() => {
    if (holding) {
      setIsVisible(true)
    }
  }, [holding])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!active) return
    pressed.current = true
    startedHold.current = false
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pressed.current || !active) return
    const dx = e.clientX - startX.current
    const draggedTowardCenter = side === "left" ? dx > DRAG_THRESHOLD : dx < -DRAG_THRESHOLD

    if (draggedTowardCenter && !startedHold.current) {
      startedHold.current = true
      onBeginHold(directionForSide)
    } else if (!draggedTowardCenter && startedHold.current) {
      startedHold.current = false
      onCancelHold()
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!pressed.current) return
    pressed.current = false
    if (startedHold.current) {
      onCancelHold()
    }
    startedHold.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  if (!active || !isVisible) return null

  // Calculate positions for viewport-based elements
  const handlePosition = {
    position: "fixed" as const,
    left: side === "left" ? "16px" : "auto",
    right: side === "right" ? "16px" : "auto",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 50,
  }

  const tooltipPosition = {
    position: "fixed" as const,
    left: side === "left" ? "60px" : "auto",
    right: side === "right" ? "60px" : "auto",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 51,
  }

  const previewPosition = {
    position: "fixed" as const,
    left: side === "left" ? "80px" : "auto",
    right: side === "right" ? "80px" : "auto",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 52,
  }

  // Custom cursor with progress ring
  const cursorStyle = holding
    ? {
        cursor: `url("data:image/svg+xml,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="2"/>
            <circle cx="16" cy="16" r="14" fill="none" stroke="rgb(59,130,246)" strokeWidth="2" 
              strokeDasharray="${2 * Math.PI * 14}" 
              strokeDashoffset="${2 * Math.PI * 14 * (1 - progress)}"
              strokeLinecap="round" transform="rotate(-90 16 16)"/>
            <circle cx="16" cy="16" r="2" fill="rgb(59,130,246)"/>
          </svg>
        `)}) 16 16, pointer`,
      }
    : {}

  return (
    <>
      {/* Apply cursor style to entire document when holding */}
      {holding && (
        <style jsx global>{`
          * {
            cursor: url("data:image/svg+xml,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="2"/>
                <circle cx="16" cy="16" r="14" fill="none" stroke="rgb(59,130,246)" strokeWidth="2" 
                  strokeDasharray="${2 * Math.PI * 14}" 
                  strokeDashoffset="${2 * Math.PI * 14 * (1 - progress)}"
                  strokeLinecap="round" transform="rotate(-90 16 16)"/>
                <circle cx="16" cy="16" r="2" fill="rgb(59,130,246)"/>
              </svg>
            `)}) 16 16, pointer !important;
          }
        `}</style>
      )}

      {/* Main Handle */}
      <motion.div
        style={handlePosition}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: holding ? 1.2 : isHovered ? 1.1 : 1,
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className="pointer-events-auto"
      >
        <div className="w-10 h-10 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border border-border/50 flex items-center justify-center hover:bg-background hover:shadow-xl transition-all duration-200">
          <Icon className="h-5 w-5 text-foreground/80" />
        </div>
      </motion.div>

      {/* Tooltip - only show when not holding */}
      <AnimatePresence>
        {isHovered && !holding && (
          <motion.div
            style={tooltipPosition}
            initial={{ opacity: 0, scale: 0.9, x: side === "left" ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-none"
          >
            <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
              <div className="text-xs text-muted-foreground whitespace-nowrap">Drag inward and hold for 2s</div>
              <div className="text-xs font-medium text-foreground">
                Go to {side === "left" ? "previous" : "next"} period
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Hint - show when holding */}
      <AnimatePresence>
        {holding && previewText && (
          <motion.div
            style={previewPosition}
            initial={{ opacity: 0, scale: 0.9, x: side === "left" ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-none"
          >
            <div className="bg-background/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl px-4 py-3 shadow-xl">
              <div className="text-xs text-muted-foreground mb-1">Navigating to:</div>
              <div className="text-lg font-semibold text-foreground mb-2">{previewText}</div>

              {/* Progress bar with timeline-style design */}
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>

              {/* Small indicator dots */}
              <div className="flex justify-center mt-2 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${progress > i / 5 ? "bg-primary" : "bg-muted"}`}
                    animate={{
                      scale: progress > i / 5 ? 1.2 : 1,
                      opacity: progress > i / 5 ? 1 : 0.5,
                    }}
                    transition={{ delay: i * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
