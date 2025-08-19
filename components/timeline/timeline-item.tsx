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
  verticalScrollOffset?: number
  isVerticalScrolling?: boolean
}

const mockFinanceData = [
  { id: 1, type: "income", amount: 2500, description: "Salary", time: "09:00" },
  { id: 2, type: "expense", amount: -45, description: "Coffee", time: "10:30" },
  { id: 3, type: "expense", amount: -120, description: "Groceries", time: "14:15" },
  { id: 4, type: "income", amount: 150, description: "Freelance", time: "16:45" },
]

export function TimelineItem({
  itemDate,
  formatStr,
  isCenter,
  isWheeling,
  distance,
  zoomLevel,
  onMouseEnter,
  onMouseLeave,
  verticalScrollOffset = 0,
  isVerticalScrolling = false,
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

  const hasContent = isCenter && mockFinanceData.length > 0
  const contentCards = hasContent ? mockFinanceData : []

  return (
    <motion.div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative flex flex-col items-center justify-center transition-colors duration-300 ease-out group ${
        isCenter ? "text-primary font-bold" : "text-muted-foreground"
      }`}
      style={{ opacity, scale }}
      whileHover={{ scale: Math.max(0.8, targetScale * 1.05) }}
      transition={{ duration: 0.2, ease: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      {hasContent && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            transform: `translateY(${-verticalScrollOffset}px)`,
            transition: isVerticalScrolling ? "none" : "transform 0.3s ease-out",
          }}
        >
          {/* Cards above the unit */}
          {contentCards.slice(0, 2).map((card, index) => (
            <motion.div
              key={`above-${card.id}`}
              className="absolute left-1/2 transform -translate-x-1/2 w-48 p-3 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg"
              style={{
                top: `${-120 - index * 80}px`,
                backgroundColor: card.type === "income" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                borderColor: card.type === "income" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-xs text-muted-foreground">{card.time}</div>
              <div className="text-sm font-medium">{card.description}</div>
              <div className={`text-sm font-bold ${card.type === "income" ? "text-green-400" : "text-red-400"}`}>
                ${Math.abs(card.amount)}
              </div>
            </motion.div>
          ))}

          {/* Cards below the unit */}
          {contentCards.slice(2).map((card, index) => (
            <motion.div
              key={`below-${card.id}`}
              className="absolute left-1/2 transform -translate-x-1/2 w-48 p-3 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg"
              style={{
                bottom: `${-120 - index * 80}px`,
                backgroundColor: card.type === "income" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                borderColor: card.type === "income" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-xs text-muted-foreground">{card.time}</div>
              <div className="text-sm font-medium">{card.description}</div>
              <div className={`text-sm font-bold ${card.type === "income" ? "text-green-400" : "text-red-400"}`}>
                ${Math.abs(card.amount)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div
        className={`relative z-10 text-center transition-all duration-300 group-hover:brightness-110 ${
          isCenter ? "text-4xl md:text-6xl lg:text-8xl" : "text-xl md:text-2xl lg:text-4xl"
        } ${
          hasContent ? "backdrop-blur-md bg-background/80 rounded-2xl px-6 py-4 border border-white/10 shadow-2xl" : ""
        }`}
        style={{
          textShadow: isCenter ? "0 0 20px hsla(var(--primary), 0.4)" : "none",
          backgroundImage: hasContent
            ? 'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.05"/%3E%3C/svg%3E")'
            : "none",
        }}
      >
        {formatStr}
      </div>

      {isCenter && (
        <div className={`text-sm text-muted-foreground mt-2 ${hasContent ? "relative z-10" : ""}`}>
          {getSubtextFormat(zoomLevel, itemDate)}
        </div>
      )}
    </motion.div>
  )
}
