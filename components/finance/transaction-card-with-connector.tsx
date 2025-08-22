"use client"

import type { Transaction } from "@/lib/supabase/client"
import { TransactionMiniCard } from "./transaction-mini-card"

interface TransactionCardWithConnectorProps {
  transaction: Transaction
  position: { x: number; y: number }
  connectorTarget?: { x: number; y: number } // Made optional
  onStatusChange: (transactionId: string, status: string) => Promise<void>
  onCancel: () => void
}

export function TransactionCardWithConnector({
  transaction,
  position,
  connectorTarget,
  onStatusChange,
  onCancel,
}: TransactionCardWithConnectorProps) {
  if (!position || typeof position.x !== "number" || typeof position.y !== "number") {
    console.warn("[v0] TransactionCardWithConnector: Invalid position prop", position)
    return null
  }

  const showConnector =
    connectorTarget && typeof connectorTarget.x === "number" && typeof connectorTarget.y === "number"

  return (
    <div className="absolute z-30">
      {showConnector && (
        <svg
          className="absolute pointer-events-none"
          style={{
            left: `${Math.min(position.x, connectorTarget.x)}px`,
            top: `${Math.min(position.y, connectorTarget.y)}px`,
            width: `${Math.abs(connectorTarget.x - position.x) + 4}px`,
            height: `${Math.abs(connectorTarget.y - position.y) + 4}px`,
          }}
        >
          <line
            x1={position.x < connectorTarget.x ? 0 : Math.abs(connectorTarget.x - position.x)}
            y1={position.y < connectorTarget.y ? 0 : Math.abs(connectorTarget.y - position.y)}
            x2={position.x < connectorTarget.x ? Math.abs(connectorTarget.x - position.x) : 0}
            y2={position.y < connectorTarget.y ? Math.abs(connectorTarget.y - position.y) : 0}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.6"
          />
        </svg>
      )}

      <div
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <TransactionMiniCard transactions={[transaction]} onStatusChange={(id, status) => onStatusChange(id, status)} />
      </div>
    </div>
  )
}
