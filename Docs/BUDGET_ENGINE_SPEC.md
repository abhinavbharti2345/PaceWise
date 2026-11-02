# PaceWise — Budget Engine Specification

**Module:** [`src/features/budget/budgetEngine.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/features/budget/budgetEngine.ts)  
**Tests:** `tests/budget/budgetEngine.test.ts` & `tests/budget/comprehensiveEngine.test.ts`

---

## 1. Overview & Core Philosophy

The PaceWise Budget Engine solves the common allowance pacing problem for students:

> "Given my remaining allowance and remaining days in the month, how much can I safely spend today?"

Unlike typical budgeting systems that compute a static monthly spend ceiling, the PaceWise engine:
1. Translates a monthly allowance into a **dynamic daily limit**.
2. **Rewards underspending** by rolling unspent daily money forward into the next day's limit.
3. Absorbs **fixed bills and payments** without punishing daily lifestyle spending.
4. Dynamically absorbs **mid-month income injections** (allowance from parents, scholarships, gifts).
5. Properly accounts for **informal loans and borrowings** with friends as cash flow adjustments.

---

## 2. Core Inputs & Types

```typescript
export interface BudgetConfig {
  totalMoney: number;   // Total starting allowance for the period (e.g. ₹6,000)
  startDate: string;    // ISO string (e.g. "2026-11-01T00:00:00.000Z")
  endDate: string;      // ISO string (e.g. "2026-11-30T00:00:00.000Z")
  currency?: string;    // Default '₹'
  theme?: 'light' | 'dark' | 'system';
}

export type TransactionType = 'expense' | 'income' | 'bill' | 'person';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;         // ISO string
  category?: string;
  reason?: string;
  source?: string;      // For income: 'parents' | 'salary' | 'scholarship' | 'other'
  personId?: string;
  personName?: string;
  direction?: 'gave' | 'took' | 'bought_for_me' | 'offset_debt';
  isSettlement?: boolean;
  isBoughtForMeSettlement?: boolean;
  status?: 'settled' | 'unsettled';
}
```

---

## 3. Mathematical Model & Calculation Pipeline

The core function `calculateBudget(config, transactions, currentDateStr)` executes the following sequential pipeline:

### Step 1: Calendar Normalization
All calculations operate on midnight timestamps via `date-fns`:
```typescript
const start = startOfDay(new Date(config.startDate));
const end = startOfDay(new Date(config.endDate));
const today = startOfDay(new Date(currentDateStr));
```

- **Total Days ($D_{total}$):**
  $$D_{total} = \max(1, \text{differenceInDays}(end, start) + 1)$$
- **Days Passed ($D_{passed}$):**
  $$D_{passed} = \text{clamp}(0, \text{differenceInDays}(today, start), D_{total})$$
- **Days Remaining ($D_{remaining}$):**
  $$D_{remaining} = \max(1, D_{total} - D_{passed})$$

### Step 2: Transaction Classification & Aggregation
Transactions falling outside the range $[start, end]$ are excluded. For eligible transactions:
- **Income ($I_{mid}$):** Transactions with `type === 'income'` add to available capital.
- **Bills ($B_{total}$):** Transactions with `type === 'bill'` reduce the total available pool.
- **Discretionary Expenses:**
  - Up to yesterday: $E_{prior} = \sum \text{amount}$ where `type === 'expense'` and $date < today$.
  - Today: $E_{today} = \sum \text{amount}$ where `type === 'expense'` and $date == today$.
- **Person Debt Cashflows:**
  - `gave`: Money lent out reduces user's physical cash flow.
  - `took`: Money borrowed increases user's physical cash flow.
  - Debt repayments and settlements reflect actual cash received or paid.

### Step 3: Effective Budget Pool
$$T_{effective} = T_{total} + I_{mid} - B_{total}$$

### Step 4: Base Daily Budget
$$B_{base} = \frac{T_{effective}}{D_{total}}$$

### Step 5: Carry-Forward Calculation
The carry-forward value reflects how much money was saved (or overspent) relative to the ideal daily allocation up to yesterday:
$$CF = (B_{base} \times D_{passed}) - E_{prior} + \text{NetDebtFlow}_{prior}$$

- If $CF > 0$: The user saved money, granting a budget surplus.
- If $CF < 0$: The user overspent previously, carrying a deficit.

### Step 6: Today's Available Budget
$$\text{Available}_{today} = B_{base} + CF$$

### Step 7: Remaining Daily Pace
Smoothed spending velocity across all remaining days:
$$\text{Pace}_{remaining} = \frac{\text{Money Left}}{D_{remaining}}$$

### Step 8: Total Money Left
$$\text{Money Left} = T_{effective} - (E_{prior} + E_{today}) + \text{NetDebtFlow}_{total}$$

---

## 4. Zero-Spend Days & Trend Analytics

The engine iterates from Day 0 to $D_{passed}$ to track:
1. **Zero-Spend Days:** Days with $0$ discretionary expenses logged.
2. **Cumulative Spent vs Ideal Spent Curve:** Generates `dailyStats` array used to plot the pacing graph in the Insights tab.

---

## 5. Edge Cases & Robustness

| Scenario | Engine Handling |
| :--- | :--- |
| **Current date before budget start** | $D_{passed}$ clamped to $0$; $D_{remaining} = D_{total}$; zero carry-forward. |
| **Current date after budget end** | $D_{passed} = D_{total}$; $D_{remaining} = 1$; prompts month rollover. |
| **Single-day budget period** | $D_{total} = 1$; denominator protected with $\max(1, \dots)$ preventing division by zero. |
| **Large bill exceeds allowance** | $T_{effective}$ becomes negative; `isOverspent = true`; UI displays warning state. |
| **Overspending today** | Allowed without blocking transaction entry; reduces Money Left and carries deficit forward to tomorrow. |
