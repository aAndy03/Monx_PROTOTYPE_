"use client"

import type React from "react"

import { useRef } from "react"
import { motion, useTransform, useSpring } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface EdgeHandleProps {
  side: "left" | "right"
  active: boolean
  holding: boolean
  progress: number // 0..1
  onBeginHold: (direction: "up" | "down") => void
  onCancelHold: () => void
  onCompleteHold: (direction: "up" | "down") => void
}

const SIZE = 64
const RADIUS = 24
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const DRAG_THRESHOLD = 12 // px toward center to arm the hold

export function EdgeHandle({
  side,
  active,
  holding,
  progress,
  onBeginHold,
  onCancelHold,
  onCompleteHold,
}: EdgeHandleProps) {
  const p = useSpring(progress, { stiffness: 300, damping: 30, mass: 0.6 })
  p.set(progress)

  const ringOffset = useTransform(p, [0, 1], [CIRCUMFERENCE, 0])
  const ringOpacity = useTransform(p, [0, 0.2, 0.6, 1], [0.2, 0.6, 0.85, 1])
  const glowOpacity = useTransform(p, [0, 1], [0, 0.55])

  const sideClasses = side === "left" ? "left-2 items-start justify-start" : "right-2 items-end justify-end"
  const Icon = side === "left" ? ChevronLeft : ChevronRight

  // Local drag state
  const pressed = useRef(false)
  const startedHold = useRef(false)
  const startX = useRef(0)

  const directionForSide: "up" | "down" = side === "left" ? "up" : "down"

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
      // moved back out of the arm zone
      startedHold.current = false
      onCancelHold()
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!pressed.current) return
    pressed.current = false
    if (startedHold.current) {
      // If progress already reached 1, parent onBeginHold will call onComplete.
      // On release before complete, cancel.
      onCancelHold()
    }
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // When the progress reaches 1, parent will complete and change context.
  // We also expose onCompleteHold for external triggering if needed.
  // Here, we only render visuals and drive the gesture wiring.

  return (
    <div className={`absolute top-1/2 -translate-y-1/2 ${sideClasses} flex`} aria-hidden="true">
      <motion.div
        className="relative pointer-events-auto"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        animate={{
          scale: active ? 1 : 0.9,
          opacity: active ? 1 : 0.6,
          x: holding ? (side === "right" ? 2 : -2) : 0,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
      >
        {/* Subtle glow */}
        <motion.div
          className="absolute inset-0 rounded-full blur-md"
          style={{ opacity: glowOpacity }}
          animate={{
            backgroundColor: holding ? "rgba(59,130,246,0.45)" : "rgba(59,130,246,0.25)",
          }}
        />

        {/* Button container */}
        <div
          className="relative w-16 h-16 rounded-full bg-card/80 shadow-lg border border-border/50 flex items-center justify-center"
          role="button"
          aria-label={
            side === "left" ? "Drag left edge to go to previous context" : "Drag right edge to go to next context"
          }
        >
          <Icon className="h-6 w-6 text-primary" />
          {/* Progress ring */}
          <svg className="absolute inset-0 -rotate-90" width={SIZE} height={SIZE} viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="transparent"
              stroke="currentColor"
              className="text-muted-foreground/20"
              strokeWidth="4"
            />
            <motion.circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="transparent"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-primary"
              style={{
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: ringOffset,
                opacity: ringOpacity,
              }}
            />
          </svg>
        </div>
      </motion.div>
    </div>
  )
}
