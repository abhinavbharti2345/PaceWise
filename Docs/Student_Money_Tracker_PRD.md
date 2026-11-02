# PaceWise — Product Requirements Document (PRD)

**Version:** 2.5 • **Status:** Production / Implemented  
**Tagline:** *Track. Pace. Prosper.*

---

## 1. Executive Summary

**PaceWise** is an intelligent, student-centric personal finance and shared-expense web application. Built specifically around the financial realities of students and young adults living on fixed monthly allowances or stipends, PaceWise replaces complex corporate banking tools with a single intuitive answer to the everyday question:

> **"Given the money I have and the days remaining, how much can I safely spend today?"**

Unlike standard expense trackers that merely categorize past transactions, PaceWise dynamically calculates a daily spending pace, carries forward unspent allowance to future days, absorbs fixed bills without penalizing daily habits, and handles both informal 1-on-1 friend debts and multi-member group trip/room splits with minimal settlements.

---

## 2. Problem Statement

1. **Allowance Pacing Deficit:** Students receive lump-sum funds (monthly allowance from parents, scholarships, or freelance income) at the start of each month. Without real-time pacing, funds are often exhausted within the first 10–15 days.
2. **Corporate Bloat in Existing Apps:** Traditional personal finance apps require bank linkages, investment tracking, and multi-layered accounting categories designed for salaried homeowners with mortgages.
3. **Informal Friend Debts:** Students frequently pay for each other (cabs, hostel meals, shared groceries). Keeping track of who paid whom, partial cash settlements, and "bought for me" scenarios is messy and causes friction.
4. **Group Expense Chaos:** Roommates and travel groups struggle with who paid for what and require separate third-party apps just to calculate group debt transfers.

---

## 3. Core Product Principles

1. **Pacing Over Accounting:** The app's primary metric is **Today's Available Budget**, not just a static bank balance.
2. **Reward Underspending:** Underspending today gives you more money tomorrow (Carry-Forward). Overspending today gently recalibrates your pace over the remaining days.
3. **Distinguish Bills from Daily Spending:** Fixed payments (rent, college fees, electricity, subscriptions) are treated as non-discretionary subtractions from total capital rather than daily lifestyle spikes.
4. **Informal Debt Clarity:** Separate personal lifestyle spending from money lent to or borrowed from friends.
5. **Zero-Friction Mobile Experience:** Rapid entry via bottom sheets/modals with minimum 44px touch targets conforming to Apple Human Interface guidelines.
6. **Privacy & Offline First:** Local-first reactivity via Zustand with full cloud synchronization and strict PostgreSQL Row Level Security (RLS).

---

## 4. Financial Calculations & The Budget Engine

The calculations powering PaceWise reside in [`src/features/budget/budgetEngine.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/features/budget/budgetEngine.ts).

### 4.1 Variables & Definitions
- $T_{total}$: Starting monthly allowance configured in `budget_configs.total_money`.
- $D_{total}$: Total days in the active budget period (default: calendar month length, e.g., 28–31 days).
- $D_{passed}$: Number of days elapsed since the budget start date (clamped between $0$ and $D_{total}$).
- $D_{remaining}$: Days remaining including today ($D_{total} - D_{passed}$).
- $I_{mid}$: Total mid-month income / additional money received.
- $B_{total}$: Total fixed bills and non-discretionary payments.
- $E_{prior}$: Cumulative discretionary expenses logged up to yesterday.
- $E_{today}$: Discretionary expenses logged today.
- $CF$: Cumulative carry-forward balance.

### 4.2 Mathematical Formulas

#### Effective Total Budget:
$$T_{effective} = T_{total} + I_{mid} - B_{total}$$

#### Base Daily Budget:
$$B_{base} = \frac{T_{effective}}{D_{total}}$$

#### Carry-Forward Calculation:
Carry-forward reflects the cumulative difference between the ideal daily allocation and actual spending up to yesterday, taking into account net debt cashflows:
$$CF = (B_{base} \times D_{passed}) - E_{prior} + \text{NetDebtFlow}_{prior}$$

#### Today's Available Budget:
$$\text{Available}_{today} = B_{base} + CF$$

#### Remaining Daily Pace:
If the user prefers a smoothed pace for all remaining days:
$$\text{Pace}_{remaining} = \frac{\text{Money Left}}{D_{remaining}}$$

#### Money Left:
$$\text{Money Left} = T_{effective} - (E_{prior} + E_{today}) + \text{NetDebtFlow}_{total}$$

#### Zero-Spend Days:
The engine computes every calendar day in the period that has passed with $0$ discretionary expenses logged, rewarding students with positive financial reinforcement.

---

## 5. Functional Requirements

### 5.1 Dashboard (Home)
- **Hero Money Left Card:** Distinctive dark red gradient card displaying the total actual money left, total monthly pool, and budget depletion progress bar.
- **Daily Budget Metric:** Circular pace indicator displaying **Today's Available Budget**, spent today, and remaining daily allowance.
- **Carry-Forward Badge:** Color-coded pill (`+₹XX` green for saved allowance, `-₹XX` red for deficit carry-forward).
- **Quick Action Bar:** One-tap triggers for `+ Add Expense`, `+ Add Money`, and `+ Add Bill`.
- **People Summary Card:** Compact snapshot displaying `To Receive` (green) and `You Owe` (red) with instant link to People ledger.
- **Recent Activity:** Compact transaction list showing recent events with semantic icon badges and currency amounts.

### 5.2 Expense Tracking
- **Expense Modal:** Amount input (prominent hero typography), Category selector, Reason description, Date picker (defaults to today), Payment method, and optional notes.
- **Category Support:** Default categories (Food, Transport, Education, Hostel/Rent, Entertainment, Shopping, Snacks, Healthcare, Other).
- **Custom Categories:** Ability to create custom categories with tailored Lucide icons and color palettes via `AddCategoryModal`.

### 5.3 Bills & Major Payments
- Addressed via dedicated `AddBillModal`.
- Deducts directly from $T_{effective}$ rather than skewing daily discretionary pace.
- Dedicated bill categories (Rent, Tuition, Wifi/Recharge, Utility, Insurance).

### 5.4 Adding Money / Income Injections
- Triggered via `AddMoneyModal`.
- Tracks sources (Parents, Salary, Scholarship, Gift, Freelance, Other).
- Mid-month additions instantly expand remaining allowance and recalculate the daily spending pace across remaining days.

### 5.5 People & Debt Management (1-on-1)
- **Ledger Entries:**
  - `gave`: User lent money to friend (Friend owes user $\rightarrow$ "To Receive").
  - `took`: User borrowed money from friend (User owes friend $\rightarrow$ "You Owe").
  - `bought_for_me`: Friend paid for user's expense (User owes friend).
  - `offset_debt`: Settles an outstanding obligation by writing down a countervailing balance.
- **Settlement Modes:**
  - **Full or Partial Cash Settlement:** User receives or pays physical cash or UPI transfer.
  - **Itemized Settlement:** User selects specific transactions to settle, marking them as settled.
  - **Offset Against Existing Debt:** Automatically nets reciprocal balances.

### 5.6 Groups & Shared Expenses (Group Engine)
Implemented in [`src/utils/groupEngine.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/utils/groupEngine.ts) and [`src/store/useGroupStore.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts).
- **Group Creation:** Custom name, emoji badge, description, and member roster ("You" + friends).
- **Group Expenses:** Logged with payer assignment, amount, category, and split method:
  - **Equal Split:** Divided evenly among all group members.
  - **Custom Split:** Exact monetary shares assigned per participant.
- **Group Transfers:** Direct peer-to-peer repayments within the group context.
- **Optimal Debt Simplification:**
  - Standard multi-person groups generate $O(N^2)$ bilateral debts.
  - PaceWise runs an optimal greedy flow algorithm that computes net balances for each member and generates the minimum number of direct settlement transfers ($\le N - 1$).
- **Group Lifecycle:** Groups can be toggled between `active` and `settled`.

### 5.7 Insights & Analytics
- **Period Scoping:** Filter insights by `Today`, `This Week`, `This Month`, or `Custom Date Range`.
- **Category Breakdown:** Interactive breakdown of spending by category with percentages and total sums.
- **Spending Pace Curve:** Day-by-day comparison of actual spend vs ideal baseline pace.
- **Zero-Spend Days Counter:** Tracks discipline and non-spending milestones.
- **High-Spend / Splurge Alerts:** Flags disproportionate expenses for review via `SplurgeDetailModal`.

### 5.8 Custom Categories Management
- Accessible via the `/categories` view.
- Three dedicated tabs: **Expenses**, **Bills**, and **Income Sources**.
- Add custom categories with custom icons and theme colors.
- Hide/unhide categories to declutter modals.
- Drag-and-drop or rank-order priority reordering.

### 5.9 Month-End Rollover Engine
- Monitored by [`src/hooks/useMonthRollover.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/hooks/useMonthRollover.ts).
- Detects when the active date passes `config.endDate`.
- Prompts user to start a new budget cycle with optional rollover of positive unspent carry-forward money.

### 5.10 Settings & Data Management
- **Budget Setup:** Modify starting monthly money, start date, and end date.
- **Theme Preferences:** Light, Dark, or System automatic switching.
- **Currency:** Configurable currency symbol (default: ₹).
- **Data Deletion:**
  - *Reset All Local Data:* Wipes client store and local storage.
  - *Delete Account & Cloud Data:* Triggers Supabase Edge Function to permanently erase auth and database records.

### 5.11 Authentication & Security
- **Email/Password Auth:** Sign up, email verification flow, and login with session persistence.
- **Data Isolation:** Enforced at database level with Supabase PostgreSQL Row Level Security (RLS).
- **Profile Customization:** User display name and avatar management in `/profile`.

---

## 6. Technical Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & Design** | Tailwind CSS, Lucide React icons, clsx, tailwind-merge |
| **State Management** | Zustand (with persistent middleware) |
| **Date Manipulation** | date-fns |
| **Visualization** | Recharts |
| **Backend & Database** | Supabase (PostgreSQL 15, Supabase Auth, Deno Edge Functions) |
| **Testing** | Vitest (Unit & Integration tests) |
| **Hosting & CI/CD** | Vercel |

---

## 7. Non-Goals (Out of Scope for V2)

- Automated Open Banking / SMS transaction scraping (prohibited due to student privacy concerns and mobile OS security constraints).
- Stock/crypto portfolio trading or credit score tracking.
- Complex multi-currency conversion with live forex feeds (fixed currency symbol supported).
