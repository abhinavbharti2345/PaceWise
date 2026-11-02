# PaceWise — System Architecture

**Version:** 2.5 • **Status:** Production / Implemented  
**Stack:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Supabase (PostgreSQL 15, Auth, Deno Edge Functions)

---

## 1. High-Level Architecture Overview

PaceWise is engineered as a **local-first, reactive Single Page Application (SPA)** with real-time cloud synchronization backed by Supabase.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Browser / Mobile Device                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         React 18 + Vite UI                       │  │
│  │   Dashboard • Transactions • People • Groups • Categories • etc. │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │ Actions / Subscriptions           │
│  ┌─────────────────────────────────▼────────────────────────────────┐  │
│  │                      Zustand Client Stores                       │  │
│  │   useStore (core) • useGroupStore (groups) • useAuthStore (auth) │  │
│  └──────────────┬──────────────────────────────────┬────────────────┘  │
│                 │ Optimistic Local                 │ Hydration / Sync  │
│  ┌──────────────▼─────────────┐   ┌────────────────▼────────────────┐  │
│  │   localStorage Cache       │   │     supabaseSync Client         │  │
│  │   (pacewise-storage-${uid})│   │     (Optimistic Async Sync)     │  │
│  └────────────────────────────┘   └────────────────┬────────────────┘  │
└────────────────────────────────────────────────────┼───────────────────┘
                                                     │ HTTPS / WSS
┌────────────────────────────────────────────────────▼───────────────────┐
│                           Supabase Cloud                               │
│                                                                        │
│  ┌─────────────────────────┐             ┌──────────────────────────┐  │
│  │      Supabase Auth      │             │     Deno Edge Function   │  │
│  │  (JWT / Email sessions) │             │     (delete-user)        │  │
│  └───────────┬─────────────┘             └─────────────┬────────────┘  │
│              │ auth.uid()                              │ Admin API     │
│  ┌───────────▼─────────────────────────────────────────▼───────────┐  │
│  │              PostgreSQL 15 with Row Level Security               │  │
│  │   profiles • budget_configs • people • transactions             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Local-First Reactivity & Zero-Latency Interaction
- **Zustand State Layer:** All state reads and mutations happen against in-memory Zustand stores (`useStore`, `useGroupStore`).
- **Optimistic Updates:** UI responds instantly ($< 16\text{ms}$) to any user input (e.g. adding an expense, toggling a category, or settling debt) without awaiting remote server round-trips.
- **Client Cache:** State is mirrored locally using the `persist` middleware with user-isolated storage keys (`pacewise-storage-${userId}`).

### 2.2 Cloud Hydration & Synchronization
- Synchronized by [`src/lib/supabaseSync.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/lib/supabaseSync.ts).
- When a user signs in:
  1. Profile is verified/upserted.
  2. Budget configuration, people, and transactions are fetched concurrently.
  3. Rolling debt balances are recomputed via `calculatePersonBalance()`.
  4. The store is hydrated and `isHydrated` is toggled to true.
- After hydration, CRUD actions execute optimistic local mutations followed by background Supabase upserts or deletes.

### 2.3 Strict Multi-Tenant Data Isolation (PostgreSQL RLS)
- No user can access or mutate another user's rows.
- Every table (`profiles`, `budget_configs`, `people`, `transactions`) has Row Level Security enabled.
- Database policies check `auth.uid() = user_id` for all operations.

---

## 3. Directory & Module Organization

```
PaceWise/
├── Docs/                              # Comprehensive documentation & SQL schemas
│   ├── ARCHITECTURE.md                # System architecture (this document)
│   ├── BUDGET_ENGINE_SPEC.md          # Mathematical budget calculations spec
│   ├── GROUPS_FEATURE_SPEC.md         # Multi-member group debt simplification spec
│   ├── Pace_Stitch_Design_Prompts.md  # Stitch UI design prompts
│   ├── Student_Money_Tracker_PRD.md   # Core Product Requirements Document
│   ├── Student_Money_Tracker_UIUX.md  # UI/UX design specifications
│   ├── SUPABASE_INTEGRATION.md        # Supabase setup and integration guide
│   └── supabase-schema.sql            # Master PostgreSQL schema & RLS policies
├── src/
│   ├── components/
│   │   ├── layout/                    # Responsive AppLayout (Desktop sidebar & Mobile bottom bar)
│   │   ├── modals/                    # 15+ Centered dialogs and mobile bottom sheets
│   │   └── ui/                        # Reusable atomics (Button, Card, Input, LiveClock, Logo, etc.)
│   ├── features/
│   │   └── budget/
│   │       └── budgetEngine.ts        # Pure calculation engine for daily pace, carry-forward, etc.
│   ├── hooks/
│   │   ├── useCurrentDate.ts          # Reactive date clock hook
│   │   └── useMonthRollover.ts        # Automated cycle expiration & rollover hook
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client instantiation
│   │   └── supabaseSync.ts            # Hydration hook & async cloud sync methods
│   ├── pages/                         # Core route pages
│   │   ├── Auth.tsx                   # Authentication (Login / Signup)
│   │   ├── Categories.tsx             # Category customization
│   │   ├── Dashboard.tsx              # Main daily pacing dashboard
│   │   ├── EmailVerificationPending.tsx # Auth verification state
│   │   ├── GroupDetails.tsx           # Single group breakdown & settlement
│   │   ├── Groups.tsx                 # Groups directory
│   │   ├── Guide.tsx                  # In-app visual onboarding
│   │   ├── Insights.tsx               # Analytics, pace charts & splurge detection
│   │   ├── People.tsx                 # Friends & debt ledger
│   │   ├── PersonDetails.tsx          # 1-on-1 friend ledger & settlement
│   │   ├── Profile.tsx                # User profile & credentials
│   │   ├── Settings.tsx               # Budget setup, themes & data wipe
│   │   └── Transactions.tsx           # Full chronological transaction ledger
│   ├── store/
│   │   ├── useAuthStore.ts            # Supabase session and user state
│   │   ├── useGroupStore.ts           # Group splits & transfer management
│   │   └── useStore.ts                # Master personal finance store
│   └── utils/
│       ├── categoryHelpers.ts         # Predefined icons, palettes, and metadata
│       ├── cn.ts                      # ClassName merger (clsx + twMerge)
│       ├── currencyUtils.ts           # Currency formatting utilities
│       ├── dateUtils.ts               # Date formatters and ISO helpers
│       └── groupEngine.ts             # Greedy debt simplification & balance calculation
├── supabase/
│   └── functions/
│       └── delete-user/               # Deno Edge Function for complete account erasure
└── tests/                             # Unit & integration test suites
```

---

## 4. State Management Architecture

PaceWise separates state into three specialized stores:

### 4.1 Master Store (`useStore`)
- **State:** `config`, `transactions`, `people`, `customCategories`, `isHydrated`.
- **Key Actions:**
  - `addTransaction()`, `updateTransaction()`, `deleteTransaction()`
  - `recordPersonTransaction()` (Handles `gave`, `took`, `bought_for_me`)
  - `settleDebt()` (Handles cash repayments and offset write-downs)
  - `addCustomCategory()`, `hideCategory()`, `reorderCategories()`

### 4.2 Group Store (`useGroupStore`)
- **State:** `groups: Group[]`.
- **Key Actions:**
  - `createGroup()`, `updateGroup()`, `deleteGroup()`
  - `addExpense()` (Equal or custom splits)
  - `addTransfer()` (Direct peer transfers)
  - `setGroupStatus()` (Active / Settled)

### 4.3 Auth Store (`useAuthStore`)
- **State:** `user: User | null`, `session: Session | null`, `profile: Profile | null`.
- **Key Actions:**
  - `setUser()`, `setSession()`, `setProfile()`, `signOut()`.

---

## 5. Security & Privacy Guardrails

1. **Publishable Anon Key Only:** The web frontend bundle never exposes privileged credentials.
2. **PostgreSQL RLS Policies:** Query level security guarantees that even compromised client queries cannot select rows belonging to other users.
3. **Privileged Operations via Edge Functions:** High-privilege tasks like permanent user account deletion are delegated to secure Deno Edge Functions with JWT authorization and server-side service keys.
4. **Session Purging:** Logging out completely cleans local cache keys and resets memory stores.
