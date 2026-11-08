-- ==============================================================================
-- PaceWise Performance Optimization: Composite Indexes
-- ==============================================================================
-- Run this in the Supabase SQL Editor.
-- 
-- 1. Eliminates PostgreSQL in-memory Quicksort in work_mem for transaction feeds
--    by indexing (user_id, date DESC).
-- 2. Eliminates sequential scan for people list ordering by user_id and creation.
-- 3. Guarantees 1:1 user budget configuration mapping.
-- ==============================================================================

-- 1. Composite index for user transactions sorted by date
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON public.transactions(user_id, date DESC);

-- 2. Composite index for user people list
CREATE INDEX IF NOT EXISTS idx_people_user_created 
  ON public.people(user_id, created_at ASC);

-- 3. Unique index for budget_configs per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_configs_user_id 
  ON public.budget_configs(user_id);

-- Refresh Postgres query planner statistics
ANALYZE public.transactions;
ANALYZE public.people;
ANALYZE public.budget_configs;

