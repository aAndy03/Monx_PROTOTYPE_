"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Transaction } from "@/lib/supabase/client"
import { TransactionMiniCard } from "./transaction-mini-card"

interface TransactionIndicatorProps {
  transactions: Transaction[]
  position: { x: number; y: number }
  granularZoom: number
  isInViewport: boolean
  onStatusChange: (id: string, status: Transaction["status"]) => void
}

export function TransactionIndicator({
  transactions,
  position,
  granularZoom,
  isInViewport,
  onStatusChange,
}: TransactionIndicatorProps) {
  const [showCard, setShowCard] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // Get the primary transaction type for color coding
  const primaryType = transactions[0]?.type || "expense"
  const transactionCount = transactions.length

  // Color mapping for transaction types
  const getIndicatorColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-500 border-green-600"
      case "expense":
        return "bg-red-500 border-red-600"
      case "transfer":
        return "bg-blue-500 border-blue-600"
      default:
        return "bg-gray-500 border-gray-600"
    }
  }

  // Calculate indicator size based on zoom level and transaction count
  const getIndicatorSize = () => {
    const baseSize = Math.max(8, Math.min(16, granularZoom * 4))
    const countMultiplier = Math.min(1.5, 1 + (transactionCount - 1) * 0.2)
    return baseSize * countMultiplier
  }

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    const timeout = setTimeout(() => setShowCard(true), 300) // 300ms delay
    setHoverTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    setShowCard(false)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout)
    }
  }, [hoverTimeout])

  const indicatorSize = getIndicatorSize()

  return (
    <div
      className="absolute z-30"
      style={{
        left: position.x - indicatorSize / 2,
        top: position.y,
        transform: "translateY(-50%)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Transaction Indicator Circle */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.2 }}
        className={`rounded-full border-2 cursor-pointer shadow-sm ${getIndicatorColor(primaryType)}`}
        style={{
          width: indicatorSize,
          height: indicatorSize,
        }}
      >
        {/* Transaction count badge for multiple transactions */}
        {transactionCount > 1 && (
          <div className="absolute -top-1 -right-1 bg-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border border-gray-300 text-gray-700">
            {transactionCount}
          </div>
        )}
      </motion.div>

      {/* Hover Card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute z-40"
            style={{
              left: -120, // Center the card relative to indicator
              top: indicatorSize + 8,
            }}
          >
            <TransactionMiniCard transactions={transactions} onStatusChange={onStatusChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
