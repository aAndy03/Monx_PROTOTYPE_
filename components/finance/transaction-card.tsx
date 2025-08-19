"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Wallet, Calendar, Tag } from "lucide-react"
import { format } from "date-fns"
import type { Transaction } from "@/lib/supabase/client"

interface TransactionCardProps {
  transaction: Transaction
  onStatusChange: (id: string, status: Transaction["status"]) => void
  position: { x: number; y: number }
}

export function TransactionCard({ transaction, onStatusChange, position }: TransactionCardProps) {
  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="absolute z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-lg">
            {transaction.amount} {transaction.currency}
          </span>
        </div>
        <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
      </div>

      {transaction.description && <p className="text-gray-600 text-sm mb-3">{transaction.description}</p>}

      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span>Wallet: {transaction.category || "Uncategorized"}</span>
        </div>

        {transaction.category && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Category: {transaction.category}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(transaction.transaction_date), "PPP")}</span>
        </div>
      </div>

      {transaction.status === "pending" && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(transaction.id, "completed")}
            className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
          >
            Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(transaction.id, "canceled")}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            Cancel
          </Button>
        </div>
      )}
    </motion.div>
  )
}
