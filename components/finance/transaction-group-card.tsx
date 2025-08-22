"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react"
import type { Transaction } from "@/lib/supabase/client"

interface TransactionGroupCardProps {
  transactionGroups: Transaction[][]
  proportions: { expense: number; income: number; transfer: number }
  totalCount: number
  onStatusChange: (id: string, status: Transaction["status"]) => void
}

export function TransactionGroupCard({
  transactionGroups,
  proportions,
  totalCount,
  onStatusChange,
}: TransactionGroupCardProps) {
  const allTransactions = transactionGroups.flat()
  const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-3 w-72 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Transaction Summary</h3>
        <Badge variant="outline" className="text-xs">
          {totalCount} transactions
        </Badge>
      </div>

      {/* Proportions */}
      <div className="space-y-2 mb-3">
        {proportions.expense > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span>Expenses</span>
            </div>
            <span className="font-medium">
              {Math.round(proportions.expense * 100)}% ({Math.round(proportions.expense * totalCount)})
            </span>
          </div>
        )}
        {proportions.income > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>Income</span>
            </div>
            <span className="font-medium">
              {Math.round(proportions.income * 100)}% ({Math.round(proportions.income * totalCount)})
            </span>
          </div>
        )}
        {proportions.transfer > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3 text-blue-600" />
              <span>Transfers</span>
            </div>
            <span className="font-medium">
              {Math.round(proportions.transfer * 100)}% ({Math.round(proportions.transfer * totalCount)})
            </span>
          </div>
        )}
      </div>

      {/* Total Amount */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium">${totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
