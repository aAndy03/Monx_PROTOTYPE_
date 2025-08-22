"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Transaction } from "@/lib/supabase/client"
import { TransactionGroupCard } from "./transaction-group-card"

interface TransactionGroupIndicatorProps {
  transactionGroups: Transaction[][]
  position: { x: number; y: number }
  granularZoom: number
  onStatusChange: (id: string, status: Transaction["status"]) => void
}

export function TransactionGroupIndicator({
  transactionGroups,
  position,
  granularZoom,
  onStatusChange,
}: TransactionGroupIndicatorProps) {
  const [showCard, setShowCard] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  const allTransactions = transactionGroups.flat()
  const totalCount = allTransactions.length

  // Calculate proportions for color segments
  const getTypeProportions = () => {
    const typeCounts = allTransactions.reduce(
      (acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      expense: (typeCounts.expense || 0) / totalCount,
      income: (typeCounts.income || 0) / totalCount,
      transfer: (typeCounts.transfer || 0) / totalCount,
    }
  }

  const proportions = getTypeProportions()
  const indicatorSize = Math.max(12, Math.min(24, granularZoom * 6 + totalCount * 2))

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    const timeout = setTimeout(() => setShowCard(true), 300)
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
      {/* Grouped Transaction Indicator */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.2 }}
        className="rounded-full border-2 border-gray-400 cursor-pointer shadow-md overflow-hidden"
        style={{
          width: indicatorSize,
          height: indicatorSize,
          background: `conic-gradient(
            #ef4444 0deg ${proportions.expense * 360}deg,
            #22c55e ${proportions.expense * 360}deg ${(proportions.expense + proportions.income) * 360}deg,
            #3b82f6 ${(proportions.expense + proportions.income) * 360}deg 360deg
          )`,
        }}
      >
        {/* Transaction count */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-bold text-gray-700">
          {totalCount}
        </div>
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
              left: -140,
              top: indicatorSize + 8,
            }}
          >
            <TransactionGroupCard
              transactionGroups={transactionGroups}
              proportions={proportions}
              totalCount={totalCount}
              onStatusChange={onStatusChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
