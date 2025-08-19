"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createTransaction, type Transaction } from "@/lib/supabase/client"

interface TransactionFormInlineProps {
  initialDate: Date
  onTransactionCreated: (transaction: Transaction, shouldNavigate: boolean) => void
  onCancel: () => void
}

export function TransactionFormInline({ initialDate, onTransactionCreated, onCancel }: TransactionFormInlineProps) {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [wallet, setWallet] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date>(initialDate)
  const [status, setStatus] = useState("pending")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !wallet) return

    setIsSubmitting(true)
    try {
      const transaction = await createTransaction({
        amount: Number.parseFloat(amount),
        currency,
        wallet,
        category: category || null,
        description: description || null,
        transaction_date: date.toISOString(),
        status,
      })

      const shouldNavigate = date.getTime() !== initialDate.getTime()
      onTransactionCreated(transaction, shouldNavigate)
    } catch (error) {
      console.error("Failed to create transaction:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-80 mx-auto mt-8">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Add Transaction</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Amount *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
              Currency *
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="RON">RON</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="wallet" className="text-sm font-medium text-gray-700">
            Wallet *
          </Label>
          <Input
            id="wallet"
            placeholder="Cash, Bank Account, Credit Card..."
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-sm font-medium text-gray-700">
            Category
          </Label>
          <Input
            id="category"
            placeholder="Food, Transport, Entertainment..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="status" className="text-sm font-medium text-gray-700">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 resize-none"
            rows={2}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full mt-1 justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !amount || !wallet}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Adding..." : "Add Transaction"}
          </Button>
        </div>
      </form>
    </div>
  )
}
