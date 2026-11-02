# PaceWise — UI/UX Design Specification

**Version:** 2.5 • **Status:** Production / Implemented  
**Application:** PaceWise (*"Track. Pace. Prosper."*)

---

## 1. Design Objective & Aesthetic Vision

PaceWise delivers a clean, modern, student-friendly fintech interface that feels lightweight, fast, and empowering. It avoids the intimidating jargon and rigid layouts of corporate banking apps, focusing instead on instant visual clarity:

- **Primary Goal:** A student should open the app and within **3 seconds** know exactly how much they can spend today, their carry-forward status, and their debt positions.
- **Visual Personality:** Confident, playful yet clean, generous whitespace, tactile rounded cards (16–24px border radius), and bold semantic colors.
- **Accessibility:** Minimum touch targets of 44×44px on mobile devices, high-contrast typography, and strict compliance with iOS safe-area insets.

---

## 2. Navigation Architecture

PaceWise employs a responsive adaptive navigation model:

### 2.1 Desktop Navigation (Sidebar)
A persistent fixed sidebar (240px wide) on screens $\ge 768\text{px}$ (`md` breakpoint):
- **Header:** PaceWise logo (icon mark + bold wordmark) + live greeting.
- **Primary Nav Items:**
  - 🏠 **Dashboard** (`/`)
  - 💸 **Transactions** (`/transactions`)
  - 👥 **People** (`/people`)
  - 🏖️ **Groups** (`/groups`)
  - 🏷️ **Categories** (`/categories`)
  - 📊 **Insights** (`/insights`)
  - 📖 **Guide** (`/guide`)
  - ⚙️ **Settings** (`/settings`)
- **Footer:** User Profile summary card (`/profile`) with avatar, display name, email, and one-click quick logout.
- **Active State:** Highlighted with a primary solid red background (`bg-red-500 text-white font-medium`) and soft shadow.

### 2.2 Mobile Navigation (Bottom Nav Bar + FAB)
On screens $< 768\text{px}$:
- **Fixed Bottom Navigation Bar:** Ergonomically placed at the bottom with safe-area padding (`pb-safe`).
- **Items:** Dashboard, Transactions, Quick `+` Action, People, Groups, More (Categories / Insights / Settings).
- **Floating / Primary Quick Actions:** Floating action trigger or hero buttons on the Dashboard for immediate entry.

---

## 3. Global Design System

### 3.1 Color Palette

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| **Primary Red** | `#FF3B30` | Hero "Money Left" gradient, `+ Add Expense` button, negative balances, overspending alerts |
| **Warning Orange** | `#FFB400` | Fixed bills, upcoming deadlines, moderate budget threshold alerts |
| **Success Green** | `#25C266` | Carry-forward savings (`+₹XX`), "To Receive" balances, income additions, positive on-pace indicators |
| **Dark Neutral (Card)** | `#14171A` | Dark hero card surfaces, dark mode card backgrounds |
| **App Background (Light)** | `#F8FAFC` | Light mode background (`bg-slate-50`) |
| **App Background (Dark)** | `#0F172A` | Dark mode background (`bg-slate-900`) |
| **Border / Divider** | `#E2E8F0` / `#334155` | Subtle borders for cards and input containers |

> [!IMPORTANT]
> Color is never the sole indicator of financial status. Every balance or state is paired with an explicit `+`/`−` sign, directional icon, or textual label.

### 3.2 Typography
- **Font Family:** Modern geometric sans-serif (Inter, system-ui fallback).
- **Money Displays:** 32px–42px bold font (`font-bold tracking-tight`) for instant scanning.
- **Section Headers:** 18px–20px semi-bold (`font-semibold`).
- **Meta / Captions:** 12px–13px medium (`text-slate-500 font-medium`).

---

## 4. Screen Specifications

### 4.1 Dashboard (`src/pages/Dashboard.tsx`)
The centerpiece of daily usage:
1. **Header:** Date badge, greeting, and live clock ([LiveClock.tsx](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/components/ui/LiveClock.tsx)).
2. **Hero "Money Left" Card:**
   - Dark red gradient background (`from-red-600 to-rose-950`).
   - Displays **Total Money Left** in bold 38px typography.
   - Shows starting total budget and remaining days.
   - Visual progress bar indicating percentage of monthly allowance remaining.
3. **Daily Budget Pace Card:**
   - Circular progress ring showing today's discretionary spend vs daily limit.
   - **Today's Available Budget** prominently highlighted.
   - **Carry-Forward Badge:** Green pill showing unspent allowance saved from yesterday or red pill if carrying a deficit.
4. **Quick Action Grid:**
   - Large touch-friendly pill buttons: `+ Add Expense` (Red), `+ Add Money` (Green), `+ Add Bill` (Orange).
5. **People Debt Widget:**
   - Split card showing: `To Receive` (green) and `You Owe` (red) with tap-to-open shortcut to `/people`.
6. **Recent Transactions Feed:**
   - Compact list rows showing the last 5 transactions with category icons, notes, and right-aligned amount.
   - "View All" link directing to `/transactions`.

### 4.2 Transactions (`src/pages/Transactions.tsx`)
Full chronological ledger of all financial activity:
- **Search Bar:** Real-time text search filtering across reasons, notes, categories, and person names.
- **Filter Tabs:** All, Expenses, Income, Bills, People.
- **Date Scope Filter:** Today, This Week, This Month, All Time, Custom Date Range.
- **Transaction Item Row:**
  - Category icon badge with tailored background color.
  - Reason / Description and timestamp.
  - Directional sign and color-coded amount (`+₹XX` green for income/received, `-₹XX` red for expense/paid).
  - Quick action menu: Edit (via `EditTransactionModal`) or Delete (with confirmation).

### 4.3 People & Person Details (`src/pages/People.tsx` & `PersonDetails.tsx`)
1-on-1 debt tracking with friends:
- **Summary Hero:** Total "You Owe", Total "To Receive", and Net Position.
- **People List:**
  - Alphabetical list with avatars, name, and current balance badge.
  - Green badge: Person owes you. Red badge: You owe person.
- **Person Details Screen:**
  - Full history ledger with that individual.
  - Chronological timeline of loans, borrowings, and "Bought for me" events.
  - **Settle Modal (`SettleModal.tsx`):**
    - Full or partial cash payment.
    - Offset against existing debt.
    - Itemized selection: Check off specific past transactions to settle.

### 4.4 Groups (`src/pages/Groups.tsx` & `GroupDetails.tsx`)
Multi-member shared expense tracking and debt simplification:
- **Groups Grid:** Active and Settled group cards with emoji icons, member counters, total group spend, and user's net position.
- **Group Details Header:**
  - Group name, emoji, status toggle (`Active` / `Settled`).
  - Total group spend, your paid amount, your share, and your net balance.
- **Simplified Settlement Transfers ("Who pays whom"):**
  - Generates minimal direct settlement transfers using graph flow minimization.
  - Direct "Settle" button to log group transfers.
- **Expenses & Transfers Tabs:**
  - Detailed list of all group expenses with payer name and split breakdown (Equal vs Custom).
  - Log of all peer-to-peer group transfers.

### 4.5 Categories (`src/pages/Categories.tsx`)
Custom category management:
- **Tabs:** Expenses, Bills, Income.
- **Category Tiles:** Icon badge, category title, active transaction count, and hide/show visibility toggle.
- **Add Custom Category:** Opens `AddCategoryModal.tsx` to pick custom title, select from Lucide icons, and choose a theme color.

### 4.6 Insights (`src/pages/Insights.tsx`)
Visual spending analytics:
- **Period Filter:** Today, This Week, This Month, Custom.
- **Category Spend Distribution:** Interactive Recharts donut/bar chart with percentage share.
- **Daily Spending Pace Graph:** Compares actual daily spending line against the ideal steady-pace allocation.
- **Zero-Spend Days Milestone:** Highlights discipline days.
- **Splurge Analysis:** Flags unusually high single transactions.

### 4.7 Guide (`src/pages/Guide.tsx`)
Interactive onboarding and visual manual:
- Illustrates how Daily Pace is calculated.
- Explains the Carry-Forward mechanic with visual before/after scenarios.
- Demonstrates debt settlement and group splitting.

### 4.8 Settings (`src/pages/Settings.tsx`)
- **Budget Configuration:** Set monthly allowance, start date, and end date.
- **Month Rollover:** Toggle automatic carry-over of unspent allowance into the next month.
- **Theme Switcher:** Single-click toggle between Light, Dark, and System mode.
- **Currency:** Set preferred currency symbol (₹, $, €, £).
- **Data Safeguards:** Local data reset and full cloud account deletion.

---

## 5. Modal Specifications

All modals are centered dialogs on desktop and slide-up bottom sheets on mobile with swipe-to-dismiss support:

1. `AddExpenseModal.tsx`: Fast expense entry (Amount hero input, Category selector, Reason, Date, Payment method).
2. `AddMoneyModal.tsx`: Income logging (Amount, Source, Date, Note).
3. `AddBillModal.tsx`: Fixed bill entry (Amount, Bill category, Date, Note).
4. `AddPersonModal.tsx`: Quick friend creation.
5. `PersonTransactionModal.tsx`: Log Gave / Took / Bought for me transactions.
6. `SettleModal.tsx`: Cash and offset settlements with itemized transaction checkboxes.
7. `CreateGroupModal.tsx`: New group setup with emoji picker and member list.
8. `AddGroupExpenseModal.tsx`: Group expense entry with Equal or Custom split calculation.
9. `AddGroupTransferModal.tsx`: Direct settlement transfer within a group.
10. `GroupSettleModal.tsx`: One-click group settlement flow.
11. `AddCategoryModal.tsx`: Custom category creation with icon and color palette picker.
12. `CategoryDetailModal.tsx`: In-depth category spending drill-down.
13. `SplurgeDetailModal.tsx`: Outlier expense inspection.
14. `ConfirmModal.tsx`: Safe confirmation dialog for destructive actions (deletions/resets).
15. `EditTransactionModal.tsx`: Transaction editing flow.
