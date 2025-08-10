"use client"

import { motion, useSpring } from "framer-motion"
import { useEffect } from "react"
import { getSubtextFormat, type ZoomLevel } from "@/lib/timeline-utils"

interface TimelineItemProps {
  itemDate: Date
  formatStr: string
  isCenter: boolean
  isWheeling: boolean
  distance: number
  zoomLevel: ZoomLevel
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function TimelineItem({
  itemDate,
  formatStr,
  isCenter,
  isWheeling,
  distance,
  zoomLevel,
  onMouseEnter,
  onMouseLeave,
}: TimelineItemProps) {
  const springConfig = { stiffness: 300, damping: 30 }

  const targetOpacity = isWheeling ? Math.max(0, 1 - distance * 0.2) * 0.5 : Math.max(0, 1 - distance * 0.2)
  const targetScale = isWheeling ? Math.max(0, 1 - distance * 0.1) * 0.98 : Math.max(0, 1 - distance * 0.1)

  const opacity = useSpring(targetOpacity, springConfig)
  const scale = useSpring(targetScale, springConfig)

  useEffect(() => {
    opacity.set(targetOpacity)
    scale.set(targetScale)
  }, [targetOpacity, targetScale, opacity, scale])

  return (
    <motion.div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`flex flex-col items-center justify-center transition-colors duration-300 ease-out group ${
        isCenter ? "text-primary font-bold" : "text-muted-foreground"
      }`}
      style={{ opacity, scale }}
      whileHover={{ scale: targetScale * 1.05 }}
      transition={{ duration: 0.2, ease: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div
        className={`text-center transition-all duration-300 group-hover:brightness-110 ${
          isCenter ? "text-4xl md:text-6xl lg:text-8xl" : "text-xl md:text-2xl lg:text-4xl"
        }`}
        style={{
          textShadow: isCenter ? "0 0 20px hsla(var(--primary), 0.4)" : "none",
        }}
      >
        {formatStr}
      </div>
      {isCenter && <div className="text-sm text-muted-foreground mt-2">{getSubtextFormat(zoomLevel, itemDate)}</div>}
    </motion.div>
  )
}
