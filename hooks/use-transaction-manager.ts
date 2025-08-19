"use client"

import { useState, useCallback } from "react"
import { supabase, type Transaction } from "@/lib/supabase/client"

export function useTransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadTransactions = useCallback(async (dateRange: { start: Date; end: Date }) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", dateRange.start.toISOString())
        .lte("transaction_date", dateRange.end.toISOString())
        .order("transaction_date", { ascending: true })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error loading transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTransaction = useCallback(
    async (transactionData: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
      try {
        const { data, error } = await supabase.from("transactions").insert([transactionData]).select().single()

        if (error) throw error

        setTransactions((prev) => [...prev, data])
        return data
      } catch (error) {
        console.error("Error creating transaction:", error)
        throw error
      }
    },
    [],
  )

  const updateTransactionStatus = useCallback(async (id: string, status: Transaction["status"]) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status, updated_at: data.updated_at } : t)))

      return data
    } catch (error) {
      console.error("Error updating transaction status:", error)
      throw error
    }
  }, [])

  return {
    transactions,
    isLoading,
    loadTransactions,
    createTransaction,
    updateTransactionStatus,
  }
}
