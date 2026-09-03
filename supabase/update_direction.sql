-- Update transactions direction constraint to allow 'bought_for_me'

-- Step 1: Drop the existing constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_direction_check;

-- Step 2: Add the new constraint with 'bought_for_me' included
ALTER TABLE transactions 
ADD CONSTRAINT transactions_direction_check 
CHECK (direction IN ('gave', 'took', 'bought_for_me'));
