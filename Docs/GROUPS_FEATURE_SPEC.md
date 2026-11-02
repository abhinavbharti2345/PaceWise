# PaceWise — Groups & Shared Expenses Specification

**Module:** [`src/utils/groupEngine.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/utils/groupEngine.ts) & [`src/store/useGroupStore.ts`](file:///C:/CS/CS%20Projects/Web-Projects/PaceWise/src/store/useGroupStore.ts)  
**Tests:** `tests/unit/groupEngine.test.ts`

---

## 1. Overview & Problem Definition

When students live together (flatmates/hostel rooms) or travel together on trips, managing shared expenses manually quickly devolves into chaos. If 4 people each pay for various items, calculating who owes whom can generate up to $\frac{N(N-1)}{2} = 6$ individual bilateral repayments, causing endless back-and-forth transfers.

The PaceWise Group Engine:
1. Supports **Equal Splits** and **Custom Splits** with designated payers.
2. Tracks peer-to-peer **Transfers** within the group.
3. Automatically computes **Minimal Settlement Transfers** using a greedy debt minimization algorithm that eliminates circular debts and ensures at most $N - 1$ total transfers settle the entire group.

---

## 2. Data Models

```typescript
export interface GroupMember {
  id: string;
  name: string;
  isUser: boolean; // Identifies the active PaceWise account owner ("You")
}

export interface GroupExpenseSplit {
  memberId: string;
  amount: number;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  date: string;
  category?: string;
  splitType: 'equal' | 'custom';
  splits: GroupExpenseSplit[];
  createdAt: string;
}

export interface GroupTransfer {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  transfers: GroupTransfer[];
  status: 'active' | 'settled';
  currency?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Balance & Summary Calculations

`calculateGroupSummary(group: Group)`:

1. **Initialize Member Balances:** For every member $m \in \text{group.members}$, initialize:
   - $\text{totalPaid} = 0$
   - $\text{totalShare} = 0$
   - $\text{netBalance} = 0$
2. **Process Expenses:**
   - Add expense amount to payer's $\text{totalPaid}$.
   - Add each split amount to corresponding member's $\text{totalShare}$.
3. **Process Direct Transfers:**
   - Add transfer amount to sender's $\text{totalPaid}$.
   - Deduct transfer amount from recipient's $\text{totalPaid}$.
4. **Calculate Net Balances:**
   $$\text{netBalance} = \text{totalPaid} - \text{totalShare}$$
   - Positive $\text{netBalance}$: Member is owed money.
   - Negative $\text{netBalance}$: Member owes money.
   - Sum of all net balances across the group strictly equals $0$.

---

## 4. Optimal Debt Simplification Algorithm

Standard group settlement without debt minimization requires multiple redundant transactions. PaceWise resolves this using a greedy debt-clearing algorithm in `calculateGroupSummary()`:

### Step 1: Partition into Debtors and Creditors
- **Debtors ($D$):** Members with $\text{netBalance} < -0.01$ (rounded to 2 decimal places).
- **Creditors ($C$):** Members with $\text{netBalance} > 0.01$.
- Sorted by magnitude in descending order.

### Step 2: Greedy Matching
While both Debtors and Creditors lists are non-empty:
1. Take debtor $d$ with largest debt $|\text{debt}|$ and creditor $c$ with largest credit $|\text{credit}|$.
2. Compute transfer amount:
   $$A = \min(|\text{debt}|, |\text{credit}|)$$
3. Create a settlement transfer:
   $$\{ \text{from}: d, \text{to}: c, \text{amount}: A \}$$
4. Adjust remaining balances:
   - $d.\text{balance} \mathrel{+}= A$
   - $c.\text{balance} \mathrel{-}= A$
5. If $d$ is settled, advance debtor pointer; if $c$ is settled, advance creditor pointer.

### Complexity & Optimality
- **Time Complexity:** $O(N \log N)$ due to sorting.
- **Max Transfers:** At most $N - 1$ total transfers required to completely settle an $N$-person group.

---

## 5. UI Integration & User Workflows

1. **Create Group:** User inputs name, selects emoji, and enters friend names. "You" is automatically pinned as member 0.
2. **Add Group Expense:** User picks description, amount, who paid, and toggles between Equal split or Custom individual amounts.
3. **View Summary:** Displays total group expenditure, the active user's total paid, their share, and net position ("You are owed ₹X" or "You owe ₹X").
4. **Simplified Settlements List:** Displays the exact minimal payments ("Aman pays You ₹1,050", "Rohan pays You ₹350").
5. **One-Tap Settle:** Clicking "Settle" logs a `GroupTransfer`, instantly recalculating balances to zero.
6. **Settling Group:** Group status can be toggled to `settled`, archiving it from active lists.
