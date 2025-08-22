"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react"
import { format } from "date-fns"
import type { Transaction } from "@/lib/supabase/client"

interface TransactionMiniCardProps {
  transactions: Transaction[]
  onStatusChange: (id: string, status: Transaction["status"]) => void
}

export function TransactionMiniCard({ transactions, onStatusChange }: TransactionMiniCardProps) {
  if (!transactions || transactions.length === 0) {
    return null
  }

  const primaryTransaction = transactions[0]
  const hasMultiple = transactions.length > 1

  if (!primaryTransaction) {
    return null
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case "expense":
        return <TrendingDown className="h-3 w-3 text-red-600" />
      case "transfer":
        return <ArrowRightLeft className="h-3 w-3 text-blue-600" />
      default:
        return <DollarSign className="h-3 w-3 text-gray-600" />
    }
  }

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
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-3 w-60 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {getTypeIcon(primaryTransaction.transaction_type || primaryTransaction.type)}
          <span className="font-medium text-sm">
            {primaryTransaction.amount} {primaryTransaction.currency}
          </span>
        </div>
        <Badge className={`text-xs ${getStatusColor(primaryTransaction.status)}`}>{primaryTransaction.status}</Badge>
      </div>

      {/* Description */}
      {primaryTransaction.description && (
        <p className="text-gray-600 text-xs mb-2 truncate">{primaryTransaction.description}</p>
      )}

      {/* Details */}
      <div className="space-y-1 text-xs text-gray-500 mb-2">
        <div className="flex justify-between">
          <span>Category:</span>
          <span className="font-medium">{primaryTransaction.category || "Uncategorized"}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span className="font-medium">{format(new Date(primaryTransaction.transaction_date), "HH:mm")}</span>
        </div>
      </div>

      {/* Multiple transactions indicator */}
      {hasMultiple && (
        <div className="text-xs text-gray-500 mb-2 p-1 bg-gray-50 rounded">
          +{transactions.length - 1} more transaction{transactions.length > 2 ? "s" : ""}
        </div>
      )}

      {/* Actions for pending transactions */}
      {primaryTransaction.status === "pending" && (
        <div className="flex gap-1 pt-2 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(primaryTransaction.id, "completed")}
            className="flex-1 text-xs h-6 text-green-600 border-green-200 hover:bg-green-50"
          >
            Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(primaryTransaction.id, "canceled")}
            className="flex-1 text-xs h-6 text-red-600 border-red-200 hover:bg-red-50"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
