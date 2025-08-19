import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Transaction = {
  id: string
  project_id: string
  user_id: string
  amount: number
  currency: string
  description?: string
  transaction_date: string
  vertical_position: number
  timeline_layer: string
  category?: string
  created_at: string
  updated_at: string
  wallet?: string
  status?: string
}

const isDevelopment = process.env.NODE_ENV === "development"
const DEV_USER_ID = "dev-user-123" // Mock user ID for development

const supabaseServiceRole =
  isDevelopment && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

export async function createTransaction(data: {
  amount: number
  currency: string
  wallet: string
  category?: string | null
  description?: string | null
  transaction_date: string
  status?: string
}): Promise<Transaction> {
  console.log("[v0] Creating transaction in development mode:", isDevelopment)

  let userId = DEV_USER_ID // Default to dev user ID
  let clientToUse = supabase // Default to regular client

  if (!isDevelopment) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated to create transactions")
    }
    userId = user.id
  } else {
    if (supabaseServiceRole) {
      clientToUse = supabaseServiceRole
      console.log("[v0] Using service role client to bypass RLS")
    }
  }

  console.log("[v0] Inserting transaction with user_id:", userId)

  const { data: transaction, error } = await clientToUse
    .from("transactions")
    .insert({
      amount: data.amount,
      currency: data.currency,
      wallet: data.wallet,
      category: data.category,
      description: data.description,
      transaction_date: data.transaction_date,
      vertical_position: 0,
      timeline_layer: "hour",
      status: data.status || "pending",
      user_id: userId, // Use dev user ID in development
      project_id: userId, // Use same ID as project ID
    })
    .select()
    .single()

  if (error) {
    console.log("[v0] Transaction creation error:", error)
    throw new Error(`Failed to create transaction: ${error.message}`)
  }

  console.log("[v0] Transaction created successfully:", transaction)
  return transaction
}

export async function getTransactions(): Promise<Transaction[]> {
  let userId = DEV_USER_ID // Default to dev user ID

  if (!isDevelopment) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated to view transactions")
    }
    userId = user.id
  }

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId) // Filter by dev user ID in development
    .order("transaction_date", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return transactions || []
}

export async function updateTransactionStatus(id: string, status: string): Promise<Transaction> {
  let userId = DEV_USER_ID // Default to dev user ID
  let clientToUse = supabase // Default to regular client

  if (!isDevelopment) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated to update transactions")
    }
    userId = user.id
  } else {
    if (supabaseServiceRole) {
      clientToUse = supabaseServiceRole
      console.log("[v0] Using service role client to bypass RLS")
    }
  }

  const { data: transaction, error } = await clientToUse
    .from("transactions")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId) // Use dev user ID in development
    .select()
    .single()

  if (error) {
    console.log("[v0] Transaction status update error:", error)
    throw new Error(`Failed to update transaction status: ${error.message}`)
  }

  console.log("[v0] Transaction status updated successfully:", transaction)
  return transaction
}
