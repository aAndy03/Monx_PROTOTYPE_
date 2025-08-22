-- Add wallets and categories tables for dropdown functionality
-- Uses conditional syntax for easy migration

-- Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'cash' CHECK (type IN ('cash', 'bank', 'credit', 'debit', 'crypto', 'investment')),
  balance numeric(15,2) DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'transfer')),
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'circle',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_active ON public.wallets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(user_id, is_active);

-- Enable RLS on new tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to match RLS script pattern)
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can create own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON public.wallets;

DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

-- RLS Policies for wallets (matching naming convention from RLS script)
CREATE POLICY "Users can view own wallets" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallets" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON public.wallets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories (matching naming convention from RLS script)
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_wallets_updated_at') THEN
    CREATE TRIGGER update_wallets_updated_at 
      BEFORE UPDATE ON public.wallets 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
    CREATE TRIGGER update_categories_updated_at 
      BEFORE UPDATE ON public.categories 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default wallets and categories for existing users
-- FIXED: Changed user_profiles.user_id to user_profiles.id
INSERT INTO public.wallets (user_id, name, type, currency)
SELECT DISTINCT id, 'Cash', 'cash', 'USD'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = user_profiles.id AND w.name = 'Cash'
);

INSERT INTO public.wallets (user_id, name, type, currency)
SELECT DISTINCT id, 'Bank Account', 'bank', 'USD'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = user_profiles.id AND w.name = 'Bank Account'
);

INSERT INTO public.wallets (user_id, name, type, currency)
SELECT DISTINCT id, 'Credit Card', 'credit', 'USD'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = user_profiles.id AND w.name = 'Credit Card'
);

-- Insert default categories for existing users
-- FIXED: Changed user_profiles.user_id to user_profiles.id
INSERT INTO public.categories (user_id, name, type, color)
SELECT DISTINCT id, 'Food', 'expense', '#EF4444'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.user_id = user_profiles.id AND c.name = 'Food' AND c.type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, color)
SELECT DISTINCT id, 'Transport', 'expense', '#3B82F6'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.user_id = user_profiles.id AND c.name = 'Transport' AND c.type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, color)
SELECT DISTINCT id, 'Entertainment', 'expense', '#8B5CF6'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.user_id = user_profiles.id AND c.name = 'Entertainment' AND c.type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, color)
SELECT DISTINCT id, 'Salary', 'income', '#10B981'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.user_id = user_profiles.id AND c.name = 'Salary' AND c.type = 'income'
);

INSERT INTO public.categories (user_id, name, type, color)
SELECT DISTINCT id, 'Freelance', 'income', '#059669'
FROM public.user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.user_id = user_profiles.id AND c.name = 'Freelance' AND c.type = 'income'
);

-- Grant permissions (matching RLS script pattern)
GRANT ALL ON public.wallets TO authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
