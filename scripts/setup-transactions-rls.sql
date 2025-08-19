-- First, add missing columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS wallet TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'canceled'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);

-- Update existing records to have default status if null
UPDATE transactions SET status = 'pending' WHERE status IS NULL;

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions table
-- Policy for users to see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id::uuid);

-- Policy for users to insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

-- Policy for users to update their own transactions
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id::uuid);

-- Policy for users to delete their own transactions
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- Grant necessary permissions to authenticated users
GRANT ALL ON transactions TO authenticated;
GRANT USAGE ON SEQUENCE transactions_id_seq TO authenticated;
