-- Add missing columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS wallet TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'canceled'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);

-- Update existing records to have default status if null
UPDATE transactions SET status = 'pending' WHERE status IS NULL;
