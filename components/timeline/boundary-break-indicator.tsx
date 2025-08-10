"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"

interface BoundaryBreakIndicatorProps {
  progress: number // 0 to 1
}

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function BoundaryBreakIndicator({ progress }: BoundaryBreakIndicatorProps) {
  const progressValue = useMotionValue(progress)
  progressValue.set(progress)

  const strokeColor = useTransform(
    progressValue,
    [0, 0.4, 0.6, 0.8, 1],
    ["#3B82F6", "#F59E0B", "#EA580C", "#DC2626", "#DC2626"],
  )

  const strokeOpacity = useTransform(progressValue, [0, 0.2, 0.4, 1], [0, 0.6, 0.8, 1])

  const strokeDashoffset = useTransform(progressValue, [0, 1], [CIRCUMFERENCE, 0])

  if (progress === 0) return null

  return (
    <motion.div
      className="w-[60px] h-[60px]"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
        {/* Background Circle */}
        <circle
          cx="30"
          cy="30"
          r={RADIUS}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
          strokeOpacity="0.2"
        />
        {/* Progress Ring */}
        <motion.circle
          cx="30"
          cy="30"
          r={RADIUS}
          fill="transparent"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{
            stroke: strokeColor,
            strokeDashoffset,
            opacity: strokeOpacity,
          }}
        />
      </svg>
    </motion.div>
  )
}
