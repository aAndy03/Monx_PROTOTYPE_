"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, DollarSign, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  createTransaction,
  getWallets,
  getCategories,
  type Transaction,
  type CreateTransactionData,
  type Wallet,
  type Category,
} from "@/lib/supabase/client"

interface EnhancedTransactionFormProps {
  initialDate: Date
  projectId: string
  onTransactionCreated: (transaction: Transaction, shouldNavigate: boolean) => void
  onCancel: () => void
}

export function EnhancedTransactionForm({
  initialDate,
  projectId,
  onTransactionCreated,
  onCancel,
}: EnhancedTransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [wallet, setWallet] = useState("")
  const [sourceWallet, setSourceWallet] = useState("")
  const [destinationWallet, setDestinationWallet] = useState("")
  const [transferToType, setTransferToType] = useState<"wallet" | "person" | "account">("wallet")
  const [transferToIdentifier, setTransferToIdentifier] = useState("")
  const [transferFee, setTransferFee] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date>(initialDate)
  const [status, setStatus] = useState("pending")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const [walletsData, categoriesData] = await Promise.all([getWallets(), getCategories(transactionType)])
        setWallets(walletsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Failed to load wallets and categories:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [transactionType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    // Validate required fields based on transaction type
    if (transactionType === "transfer") {
      if (!sourceWallet || !transferToIdentifier) return
    } else {
      if (!wallet) return
    }

    setIsSubmitting(true)
    try {
      const transactionData: CreateTransactionData = {
        transaction_type: transactionType,
        amount: Number.parseFloat(amount),
        currency,
        transaction_date: date.toISOString(),
        description: description || undefined,
        status,
        project_id: projectId,
      }

      if (transactionType === "transfer") {
        transactionData.source_wallet = sourceWallet
        transactionData.destination_wallet = destinationWallet || undefined
        transactionData.transfer_to_type = transferToType
        transactionData.transfer_to_identifier = transferToIdentifier
        transactionData.transfer_fee = transferFee ? Number.parseFloat(transferFee) : 0
      } else {
        transactionData.wallet = wallet
        transactionData.category = category || undefined
      }

      console.log("[v0] Creating transaction with data:", {
        projectId,
        transactionData,
        transactionType,
        amount: Number.parseFloat(amount),
      })

      const transaction = await createTransaction(transactionData)

      console.log("[v0] Transaction created successfully:", transaction)

      const shouldNavigate = date.getTime() !== initialDate.getTime()
      onTransactionCreated(transaction, shouldNavigate)
    } catch (error) {
      console.error("Create transaction error:", error)
      console.log("[v0] Transaction creation failed with projectId:", projectId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "expense":
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />
      case "income":
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 w-96 mx-auto mt-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {getTypeIcon(transactionType)}
        <h3 className="text-lg font-semibold text-gray-900">
          Add {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Selector */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Transaction Type</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {(["expense", "income", "transfer"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={transactionType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setTransactionType(type)}
                className="flex items-center gap-1"
              >
                {getTypeIcon(type)}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Amount and Currency */}
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

        {/* Conditional Fields Based on Transaction Type */}
        {transactionType === "transfer" ? (
          <>
            <div>
              <Label htmlFor="sourceWallet" className="text-sm font-medium text-gray-700">
                From Wallet *
              </Label>
              <Select value={sourceWallet} onValueChange={setSourceWallet} disabled={isLoadingData}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isLoadingData ? "Loading wallets..." : "Select wallet"} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((walletItem) => (
                    <SelectItem key={walletItem.id} value={walletItem.name}>
                      {walletItem.name} ({walletItem.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transferToType" className="text-sm font-medium text-gray-700">
                Transfer To
              </Label>
              <Select value={transferToType} onValueChange={setTransferToType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Another Wallet</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transferToIdentifier" className="text-sm font-medium text-gray-700">
                {transferToType === "wallet"
                  ? "To Wallet"
                  : transferToType === "person"
                    ? "Person Email/Name"
                    : "Account Number"}{" "}
                *
              </Label>
              {transferToType === "wallet" ? (
                /* Use dropdown for wallet-to-wallet transfers */
                <Select value={transferToIdentifier} onValueChange={setTransferToIdentifier} disabled={isLoadingData}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isLoadingData ? "Loading wallets..." : "Select destination wallet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets
                      .filter((w) => w.name !== sourceWallet)
                      .map((walletItem) => (
                        <SelectItem key={walletItem.id} value={walletItem.name}>
                          {walletItem.name} ({walletItem.type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="transferToIdentifier"
                  placeholder={
                    transferToType === "person" ? "john@example.com or John Doe" : "Account number or identifier"
                  }
                  value={transferToIdentifier}
                  onChange={(e) => setTransferToIdentifier(e.target.value)}
                  className="mt-1"
                  required
                />
              )}
            </div>

            {transferToType === "wallet" && (
              <div>
                <Label htmlFor="destinationWallet" className="text-sm font-medium text-gray-700">
                  Destination Wallet Name
                </Label>
                <Input
                  id="destinationWallet"
                  placeholder="Optional: specific wallet name"
                  value={destinationWallet}
                  onChange={(e) => setDestinationWallet(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="transferFee" className="text-sm font-medium text-gray-700">
                Transfer Fee
              </Label>
              <Input
                id="transferFee"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transferFee}
                onChange={(e) => setTransferFee(e.target.value)}
                className="mt-1"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="wallet" className="text-sm font-medium text-gray-700">
                Wallet *
              </Label>
              <Select value={wallet} onValueChange={setWallet} disabled={isLoadingData}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isLoadingData ? "Loading wallets..." : "Select wallet"} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((walletItem) => (
                    <SelectItem key={walletItem.id} value={walletItem.name}>
                      {walletItem.name} ({walletItem.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={isLoadingData}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isLoadingData ? "Loading categories..." : "Select category (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((categoryItem) => (
                    <SelectItem key={categoryItem.id} value={categoryItem.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryItem.color }} />
                        {categoryItem.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Common Fields */}
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
            disabled={
              isSubmitting ||
              !amount ||
              (transactionType === "transfer" ? !sourceWallet || !transferToIdentifier : !wallet)
            }
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Adding..." : "Add Transaction"}
          </Button>
        </div>
      </form>
    </div>
  )
}
