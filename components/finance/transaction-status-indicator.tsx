"use client"

import { useState } from "react"
import type { Transaction } from "@/lib/supabase/client"

interface TransactionStatusIndicatorProps {
  transactions: Transaction[]
  position: { x: number; y: number }
  granularZoom: number
  onStatusChange: (transactionId: string, status: string) => Promise<void>
}

export function TransactionStatusIndicator({
  transactions,
  position,
  granularZoom,
  onStatusChange,
}: TransactionStatusIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const statusSummary = transactions.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const primaryStatus = Object.keys(statusSummary).sort((a, b) => statusSummary[b] - statusSummary[a])[0]
  const indicatorSize = Math.max(8, Math.min(16, granularZoom * 3))

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`rounded-full border-2 border-white shadow-sm transition-all duration-200 cursor-pointer ${getStatusColor(primaryStatus)} ${
          isHovered ? "scale-125" : ""
        }`}
        style={{
          width: `${indicatorSize}px`,
          height: `${indicatorSize}px`,
        }}
      />

      {isHovered && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg border p-2 min-w-32 z-30">
          <div className="text-xs font-medium text-gray-700 mb-1">Status Summary</div>
          {Object.entries(statusSummary).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between text-xs">
              <span className="capitalize">{status}:</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
