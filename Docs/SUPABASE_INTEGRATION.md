# PaceWise Supabase Integration Guide

## 1. Overview

PaceWise integrates with [Supabase](https://supabase.com) (PostgreSQL + Supabase Auth + Row Level Security + Edge Functions) to provide secure cloud persistence, multi-device sync, and zero-leakage data isolation. 

While offline or during active user interaction, PaceWise operates as an **optimistic local-first application** backed by Zustand stores and scoped `localStorage` caching (`pacewise-storage-${userId}`). All state mutations are synced asynchronously to Supabase.

---

## 2. Quick Start

### 2.1 Create a Supabase Project

1. Navigate to [supabase.com](https://supabase.com) and sign in to your dashboard.
2. Click **New Project**, choose a project name (e.g., `pacewise-prod`), set a secure database password, and select your nearest region.
3. Once provisioned, open **Project Settings > API**.
4. Retrieve your **Project URL** (`https://<project-ref>.supabase.co`) and **Publishable / Anon API Key** (`eyJ...`).

### 2.2 Execute Database Schema

1. In your Supabase dashboard, navigate to the **SQL Editor**.
2. Click **New query**.
3. Copy and run the entire script from [supabase-schema.sql](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/Docs/supabase-schema.sql).
4. This creates all core tables (`profiles`, `budget_configs`, `people`, `transactions`), performance indexes, and enables strict Row Level Security (RLS) policies.

### 2.3 Configure Environment Variables

Create or update `.env` in the root of your project:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_anon_key_here
```

> [!CAUTION]
> Never commit `.env` or paste your Supabase `SERVICE_ROLE_KEY` into frontend client code. The client only needs the public publishable anon key.

### 2.4 Deploy to Vercel

1. In your Vercel Project Settings, navigate to **Environment Variables**.
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Trigger a redeploy.

### 2.5 Local Development

```bash
npm install              # Install dependencies
npm run build           # Verify TypeScript compilation and Vite build
npm test                # Run Vitest test suites
npm run dev             # Start development server
```

---

## 3. Database Architecture & Schema

### 3.1 Tables Overview

| Table | Description | Primary Key | Foreign Keys |
| :--- | :--- | :--- | :--- |
| `public.profiles` | User profile details extending `auth.users` | `id` (UUID) | `id` -> `auth.users(id)` ON DELETE CASCADE |
| `public.budget_configs` | Active budget period, starting money, currency, theme | `id` (UUID) | `user_id` -> `public.profiles(id)` ON DELETE CASCADE |
| `public.people` | Friends tracked for 1-on-1 debt | `id` (UUID) | `user_id` -> `public.profiles(id)` ON DELETE CASCADE |
| `public.transactions` | Expenses, income, bills, and debt transfers | `id` (UUID) | `user_id` -> `public.profiles(id)`, `person_id` -> `public.people(id)` |

### 3.2 Schema Columns & Constraints

#### `public.profiles`
- `id`: UUID (Primary Key, matches `auth.users.id`)
- `email`: TEXT (Unique, NOT NULL)
- `display_name`: TEXT
- `avatar_url`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ

#### `public.budget_configs`
- `id`: UUID (Primary Key)
- `user_id`: UUID (NOT NULL, FK to `profiles`)
- `total_money`: NUMERIC (NOT NULL, default 0)
- `start_date`: TIMESTAMPTZ (NOT NULL)
- `end_date`: TIMESTAMPTZ (NOT NULL)
- `currency`: TEXT (Default `'₹'`)
- `theme`: TEXT (Default `'system'`, options: `'light' | 'dark' | 'system'`)

#### `public.people`
- `id`: UUID (Primary Key)
- `user_id`: UUID (NOT NULL, FK to `profiles`)
- `name`: TEXT (NOT NULL)
- `avatar_url`: TEXT
- `balance`: NUMERIC (Default 0, computed balance)

#### `public.transactions`
- `id`: UUID (Primary Key)
- `user_id`: UUID (NOT NULL, FK to `profiles`)
- `type`: TEXT (`'expense' | 'income' | 'bill' | 'person'`)
- `amount`: NUMERIC (NOT NULL)
- `date`: TIMESTAMPTZ (NOT NULL)
- `category`: TEXT
- `reason`: TEXT
- `source`: TEXT (For income: `'parents' | 'salary' | 'scholarship' | 'other'`)
- `person_id`: UUID (Nullable, FK to `people`)
- `person_name`: TEXT
- `direction`: TEXT (`'gave' | 'took' | 'bought_for_me' | 'offset_debt'`)
- `is_settlement`: BOOLEAN (Default FALSE)
- `is_bought_for_me_settlement`: BOOLEAN (Default FALSE)
- `status`: TEXT (Default `'unsettled'`)
- `payment_method`: TEXT
- `note`: TEXT

---

## 4. Row Level Security (RLS) Policy Design

Every table has Row Level Security turned ON (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Users can only query, insert, update, or delete rows where `auth.uid() = user_id` (or `auth.uid() = id` for `profiles`).

Example policy:
```sql
CREATE POLICY "Users can view their own transactions" 
  ON public.transactions
  FOR SELECT 
  USING (auth.uid() = user_id);
```

This guarantees 100% cryptographic isolation between student accounts even in multi-tenant environments.

---

## 5. Client Synchronization Architecture

The sync engine resides in [`src/lib/supabaseSync.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/lib/supabaseSync.ts) and [`src/store/useStore.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/store/useStore.ts).

### 5.1 Hydration Lifecycle (`useSupabaseSync`)
1. **User Authentication:** When a session is established in `useAuthStore`, `useSupabaseSync` triggers.
2. **Double-Mount Guard:** React 18 strict mode double-mounting is guarded via module-level `activeFetchUserId`.
3. **Profile Verification:** Checks if `profiles` record exists; if absent, automatically generates a profile row with the user's email or metadata display name.
4. **Data Fetching:** Concurrently retrieves `budget_configs`, `people`, and `transactions` sorted chronologically.
5. **State Hydration:** Hydrates Zustand store (`useStore.setState({ people, transactions })`) and updates dynamic debt balances via `calculatePersonBalance()`.
6. **Flag Unlocking:** Sets `isHydrated = true`, revealing the UI without layout shifts or flash of empty state.

### 5.2 Optimistic Updates & Sync Helpers
Whenever a user logs an expense, creates a debt transaction, or settles:
- **Instant UI Response:** Local Zustand store updates immediately for zero-latency interactions.
- **Background Sync:** Dedicated functions push changes to Supabase:
  - `addTransactionToSupabase(user_id, transaction)`
  - `deleteTransactionFromSupabase(user_id, id)`
  - `addPersonToSupabase(user_id, person)`
  - `deletePersonFromSupabase(user_id, id)`
  - `updatePersonBalanceInSupabase(user_id, personId, balance)`

---

## 6. Supabase Edge Functions: Account & Data Deletion

PaceWise includes a secure Edge Function located at `supabase/functions/delete-user/index.ts`.

### Why an Edge Function?
Standard Supabase client tokens cannot delete their own record from `auth.users` for security reasons. The `delete-user` Deno Edge Function:
1. Validates the caller's JWT `Authorization: Bearer <token>` to confirm identity.
2. Uses the internal `SUPABASE_SERVICE_ROLE_KEY` (kept strictly in the Deno environment, never sent to the browser).
3. Calls `supabaseAdmin.auth.admin.deleteUser(user.id)`.
4. Cascades deletions across `profiles`, `budget_configs`, `people`, and `transactions`.
5. Enforces CORS restrictions matching `APP_ORIGIN`.

---

## 7. Troubleshooting & Verification

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **"Missing Supabase environment variables"** | Missing `.env` | Ensure `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Restart Vite dev server (`npm run dev`). |
| **"Permission denied" / RLS Error** | RLS policy missing or wrong UID check | Re-run [supabase-schema.sql](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/Docs/supabase-schema.sql) in SQL Editor. Verify `auth.uid() = user_id`. |
| **"Failed to fetch / network error"** | Supabase project paused or wrong URL | Check Supabase dashboard to verify project is Active. Ensure URL protocol is `https://`. |
| **Stale data after reset** | Local cache or sync flag not cleared | Call `resetSyncFlag()` and use `clearAllData()` from `useStore`. |
