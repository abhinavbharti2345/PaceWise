# PaceWise Supabase Integration Guide

## Overview

PaceWise has been integrated with Supabase for secure, cloud-based data persistence. User data is now stored in Supabase PostgreSQL instead of browser localStorage, enabling multi-device sync and secure authentication.

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Copy your project URL and publishable API key from **Settings > API**

### 2. Set Up Database Schema

1. In Supabase, go to the **SQL Editor**
2. Open a new query
3. Copy and run the entire contents of `docs/supabase-schema.sql`
4. This creates all tables with Row Level Security (RLS) policies

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env` (already done locally)
2. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
   ```
3. Never commit `.env` (it's in `.gitignore`)

### 4. Deploy on Vercel

1. In Vercel project settings, add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Redeploy to apply the new configuration

### 5. Local Development

```bash
npm install              # Install dependencies (includes @supabase/supabase-js)
npm run build           # Build the app
npx vitest run          # Run tests
npm run dev             # Start dev server
```

## Architecture

### Authentication Flow

1. **First Visit**: User sees login/signup page
2. **Sign Up**: Creates new account in Supabase Auth
3. **Sign In**: Authenticates and loads user's data
4. **Auto-sync**: On every app start, Supabase session is restored automatically
5. **Sign Out**: Available in Settings page

### Data Storage

All persistent data is stored in Supabase PostgreSQL:

- **profiles**: User account information
- **budget_configs**: Monthly budget settings
- **people**: People tracked for debt
- **transactions**: All expense, income, bill, and person transactions

### Security

- **Row Level Security (RLS)**: Every user can ONLY access their own data
- **No Secret Keys**: Frontend only uses the public anon/publishable key
- **Encrypted Connections**: All data in transit is encrypted via HTTPS
- **Auth-based Access**: All tables require valid Supabase authentication

## Data Migration

### From localStorage to Supabase

The app automatically migrates existing localStorage data when a user logs in:

1. **First Login**: If user had local data (from before authentication was added)
2. **Preserved**: All existing transactions, people, and budget settings are maintained
3. **No Duplicates**: Migration logic prevents re-importing the same data

To manually trigger migration:
- Sign in with the same email used before
- Data will be detected and migrated automatically

## Using the App

### After Authentication

1. **Dashboard**: Shows daily budget, recent transactions, people owing money
2. **Transactions**: Add/view all expenses, income, bills, and person transactions
3. **People**: Manage people you track debt with
4. **Insights**: View spending analytics
5. **Settings**: 
   - Manage budget settings
   - Change theme (light/dark/system)
   - Sign out

### Data Sync

- **Real-time**: Changes are synced to Supabase immediately
- **Offline**: App uses local Zustand store while offline
- **Auto-reconnect**: Data syncs when connection is restored

## API Functions

The `src/lib/supabaseSync.ts` file provides these functions:

```typescript
// Use in components after authentication
import { 
  addTransactionToSupabase, 
  deleteTransactionFromSupabase,
  addPersonToSupabase, 
  deletePersonFromSupabase,
  updatePersonBalanceInSupabase 
} from '../lib/supabaseSync';

// In a modal or component:
const user_id = useAuthStore((state) => state.user?.id);
await addTransactionToSupabase(user_id, { /* transaction */ });
```

## Troubleshooting

### "Missing Supabase environment variables"

**Problem**: App won't start, showing error about missing env vars
**Solution**: Ensure `.env` file exists with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### "Failed to connect to Supabase"

**Problem**: Auth or data operations fail
**Solution**: 
1. Verify URL and key are correct
2. Check that Supabase project is online
3. Ensure RLS policies are enabled on all tables

### "Sign in works but no data appears"

**Problem**: User can log in but sees empty dashboard
**Solution**:
1. Data may still be migrating from localStorage
2. Try adding a transaction manually
3. Check Supabase > Tables to verify data was stored

### "Permission denied" on database operations

**Problem**: App tries to read/write but gets RLS error
**Solution**:
1. Verify `profiles` table exists and user has a profile
2. Check that RLS policies were applied correctly
3. Ensure user is authenticated (not anon token)

## Development

### Adding New Data Types

To add new data to Supabase:

1. **Create table** in Supabase SQL editor
2. **Enable RLS** on the table
3. **Add RLS policies** for SELECT, INSERT, UPDATE, DELETE
4. **Update types** in relevant TypeScript files
5. **Implement sync functions** in `src/lib/supabaseSync.ts`
6. **Update Zustand store** if needed for UI state

### Testing

Run tests with:
```bash
npx vitest run          # Run all tests
npx vitest --watch      # Watch mode for development
```

Tests currently verify:
- Budget calculations
- Transaction logic
- Store state management

## Production Checklist

Before deploying to production:

- [ ] Supabase project created and configured
- [ ] Database schema applied via SQL
- [ ] Environment variables set in Vercel
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npx vitest run`
- [ ] Manual testing of auth flow
- [ ] Manual testing of data creation/update/delete
- [ ] Verify RLS policies prevent cross-user data access

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **React Integration**: https://supabase.com/docs/guides/auth/auth-js
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

## Files Changed/Added

### New Files
- `src/lib/supabase.ts` - Supabase client setup
- `src/lib/supabaseSync.ts` - Data sync and API functions
- `src/store/useAuthStore.ts` - Authentication state management
- `src/pages/Auth.tsx` - Login/signup page
- `docs/supabase-schema.sql` - PostgreSQL schema
- `.env` (local only, not committed)
- `.env.example` - Environment variable template

### Modified Files
- `package.json` - Added @supabase/supabase-js dependency
- `src/App.tsx` - Added auth routing and Supabase sync initialization
- `src/pages/Settings.tsx` - Added logout button and user email display
- `.gitignore` - Already had .env ignored

### Database Schema

Tables created:
- `public.profiles` - User profiles (extends auth.users)
- `public.budget_configs` - Budget settings per user
- `public.people` - People tracked for debt
- `public.transactions` - All financial transactions

All tables have:
- UUID primary keys
- User ID foreign key
- Timestamps (created_at, updated_at)
- Row Level Security policies
- Appropriate indexes for performance
