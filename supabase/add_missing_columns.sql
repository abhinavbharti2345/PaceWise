-- Add missing columns to transactions table

-- Add 'status' column (text)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS status text;

-- Add 'is_bought_for_me_settlement' column (boolean)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_bought_for_me_settlement boolean DEFAULT false;

-- (Optional) Update the PostgREST schema cache to immediately recognize the new columns
NOTIFY pgrst, 'reload schema';
