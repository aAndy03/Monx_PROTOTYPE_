"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X, Wallet, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { supabase, type Transaction } from "@/lib/supabase/client"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate: Date
  onTransactionCreated: (transaction: Transaction, shouldNavigate: boolean) => void
  position: { x: number; y: number }
}

export function TransactionModal({
  isOpen,
  onClose,
  initialDate,
  onTransactionCreated,
  position,
}: TransactionModalProps) {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [wallet, setWallet] = useState("")
  const [description, setDescription] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [category, setCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("")
      setCurrency("USD")
      setWallet("")
      setDescription("")
      setSelectedDate(initialDate)
      setCategory("")
    }
  }, [isOpen, initialDate])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !wallet) return

    setIsSubmitting(true)

    try {
      const shouldNavigate = selectedDate.getTime() !== initialDate.getTime()

      const transactionData = {
        amount: Number.parseFloat(amount),
        currency,
        description,
        transaction_date: selectedDate.toISOString(),
        vertical_position: 0, // Will be calculated based on timeline position
        timeline_layer: "hour",
        category,
        status: "pending" as const,
        project_id: "00000000-0000-0000-0000-000000000000", // TODO: Get from context
        user_id: "00000000-0000-0000-0000-000000000000", // TODO: Get from auth
      }

      const { data, error } = await supabase.from("transactions").insert([transactionData]).select().single()

      if (error) throw error

      onTransactionCreated(data, shouldNavigate)
      onClose()
    } catch (error) {
      console.error("Error creating transaction:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md mx-4"
          style={{
            position: "absolute",
            left: Math.min(position.x, window.innerWidth - 400),
            top: Math.min(position.y + 60, window.innerHeight - 500),
          }}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Add Transaction
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
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

            {/* Wallet */}
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet *</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="wallet"
                  placeholder="Cash, Bank Account, Credit Card..."
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Food, Transport, Entertainment..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date)
                        setShowCalendar(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !amount || !wallet}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Creating..." : "Add Transaction"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
