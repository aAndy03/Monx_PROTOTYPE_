import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a singleton instance of the Supabase client for Client Components
export const createClient = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () =>
          Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          }),
        }),
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            }),
          }),
        }),
      }),
    } as any
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Create singleton instance
export const supabase = createClient()

export type Transaction = {
  id: string
  project_id: string
  user_id: string
  transaction_type: "expense" | "income" | "transfer"
  amount: number
  currency: string

  // For expenses and income
  wallet?: string
  category?: string

  // For transfers
  source_wallet?: string
  destination_wallet?: string
  transfer_to_type?: "wallet" | "person" | "account"
  transfer_to_identifier?: string
  transfer_fee?: number

  description?: string
  transaction_date: string
  status: string
  vertical_position: number
  timeline_layer: string
  created_at: string
  updated_at: string
}

export type CreateTransactionData = {
  transaction_type: "expense" | "income" | "transfer"
  amount: number
  currency: string
  transaction_date: string
  description?: string
  status?: string

  // For expenses and income
  wallet?: string
  category?: string

  // For transfers
  source_wallet?: string
  destination_wallet?: string
  transfer_to_type?: "wallet" | "person" | "account"
  transfer_to_identifier?: string
  transfer_fee?: number
}

export type Wallet = {
  id: string
  user_id: string
  name: string
  type: "cash" | "bank" | "credit" | "debit" | "crypto" | "investment"
  balance: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  type: "expense" | "income" | "transfer"
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function createTransaction(data: CreateTransactionData): Promise<Transaction> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Please check your environment variables.")
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`)
    }

    if (!user) {
      throw new Error("User must be authenticated to create transactions")
    }

    console.log("[v0] Creating transaction with data:", {
      originalData: data,
      userId: user.id,
      projectId: data.project_id,
    })

    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        ...data,
        vertical_position: 0,
        timeline_layer: "hour",
        status: data.status || "pending",
        user_id: user.id,
        // Use the project_id from the data instead of user.id
        project_id: data.project_id || user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Transaction creation failed:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        projectId: data.project_id || user.id,
        userId: user.id,
      })
      throw new Error(`Failed to create transaction: ${error.message}`)
    }

    console.log("[v0] Transaction created successfully:", transaction)
    return transaction
  } catch (error) {
    console.error("Create transaction error:", error)
    throw error
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, returning empty transactions")
    return []
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Authentication error:", userError)
      return []
    }

    if (!user) {
      return []
    }

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })

    if (error) {
      console.error("Fetch transactions error:", error)
      return []
    }

    return transactions || []
  } catch (error) {
    console.error("Get transactions error:", error)
    return []
  }
}

export async function updateTransactionStatus(id: string, status: string): Promise<Transaction> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Please check your environment variables.")
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`)
    }

    if (!user) {
      throw new Error("User must be authenticated to update transactions")
    }

    const { data: transaction, error } = await supabase
      .from("transactions")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update transaction status: ${error.message}`)
    }

    return transaction
  } catch (error) {
    console.error("Update transaction status error:", error)
    throw error
  }
}

export async function getWallets(): Promise<Wallet[]> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, returning empty wallets")
    return []
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Authentication error:", userError)
      return []
    }

    if (!user) {
      return []
    }

    const { data: wallets, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("Fetch wallets error:", error)
      return []
    }

    return wallets || []
  } catch (error) {
    console.error("Get wallets error:", error)
    return []
  }
}

export async function getCategories(type?: "expense" | "income" | "transfer"): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, returning empty categories")
    return []
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Authentication error:", userError)
      return []
    }

    if (!user) {
      return []
    }

    let query = supabase.from("categories").select("*").eq("user_id", user.id).eq("is_active", true)

    if (type) {
      query = query.eq("type", type)
    }

    const { data: categories, error } = await query.order("name", { ascending: true })

    if (error) {
      console.error("Fetch categories error:", error)
      return []
    }

    return categories || []
  } catch (error) {
    console.error("Get categories error:", error)
    return []
  }
}
