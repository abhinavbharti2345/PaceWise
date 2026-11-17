# Peer-to-Peer Transaction Sync & Collaborative Debt Ledger

## 1. Overview
Allow two PaceWise users (e.g. Abhinav and Hardik) to connect their accounts so that when one user records a shared expense or loan ("Lent ₹50 to Hardik"), the other user receives an in-app notification to review, choose how to categorize it in their own budget, and accept it into their personal ledger.

---

## 2. Linking Accounts: Existing vs. New Friends
Users can connect either via **Email** or a **Shareable Invite Link**:

### A. "Sync with Existing" (No Lost History)
If you already have "Hardik" listed in your People tab with past transaction history:
1. Open Hardik's profile in People.
2. Tap **"Link to PaceWise Account"**.
3. Choose either:
   - **Enter Email**: Enter the email Hardik uses for his PaceWise account.
   - **Invite Link**: Generates a unique link (e.g., `pacewise.app/invite?code=xyz`) to send via WhatsApp or SMS.
4. When Hardik accepts, his PaceWise account is mapped to your existing "Hardik" contact without erasing your past transaction logs.

### B. "Create New Connected Friend"
When adding a brand-new friend from the People tab, you can choose:
- **Local Only**: Standard offline contact name.
- **PaceWise Friend**: Send connection invite via email or link.

---

## 3. Handling Historical / Old Transactions
To prevent historical data corruption, use the **Opening Balance Handshake with Transparency Preview**:

### Why Not Individual Past Transaction Imports?
1. **Preserves Past Budgets**: Injecting 10–20 old transactions from previous months retroactively distorts Hardik's past monthly budget charts and reports.
2. **Prevents Double Counting**: Hardik may have already recorded his share in cash or from bank statements.
3. **Avoids Review Fatigue**: No one wants a barrage of notifications from months ago.

### The Handshake Flow:
1. When linking, PaceWise calculates your current net balance with Hardik (e.g., *Hardik owes you ₹150*).
2. Hardik sees an invitation preview:
   ```text
   🤝 Connection Request from Abhinav
   
   Abhinav recorded an outstanding balance:
   👉 You owe Abhinav: ₹150
   
   ▾ View Past Breakdown (3 transactions)
     • 12 Oct: Lunch (You owe ₹100)
     • 20 Oct: Chai (You owe ₹50)
   
   [ Accept as Starting Balance ]   [ Adjust / Contact ]
   ```
3. Upon acceptance:
   - Hardik’s ledger starts with a baseline starting balance of **-₹150 (owes Abhinav)** as of today.
   - Both devices are in 100% balance alignment.
   - All subsequent transactions sync individually in real time.

---

## 4. Real-time Transaction Sync Flow

```
[Abhinav] 
  Logs: "Lent ₹50 to Hardik for Coffee"
       ↓
[Supabase (Ephemeral Queue)]
  Inserts row into `transaction_requests` table
       ↓
[Hardik's App (Supabase Realtime)]
  Top-left notification bell lights up with badge (1)
       ↓
[Hardik taps Notification Bell]
  Opens review modal:
  • Amount: ₹50 | Lender: Abhinav | Reason: "Coffee"
  • Category Picker: Hardik chooses his own budget category (e.g., "Food & Drinks")
  • Note: Hardik can add his own private note
       ↓
[Hardik confirms "Accept & Add"]
  1. Transaction is saved into Hardik's local transactions & ledger
  2. Hardik's balance with Abhinav updates (+₹50 debt)
  3. The request row in Supabase is IMMEDIATELY DELETED (zero database bloat)
  4. Abhinav receives a confirmation badge that Hardik accepted
```

---

## 5. UI / UX Specifications

### Top-Left Notification Bell (Dashboard)
- **Position**: Top-left of the Dashboard header (adjacent to logo or greeting).
- **Badge**: Dynamic pill or dot displaying unread/pending count (e.g., `1`).
- **Interaction**: Opens the **Activity & Requests** drawer/sheet.

### Activity & Requests Drawer
- **Pending Received**:
  - Card per request: Lender name, amount, note, and date.
  - Quick action: **Review & Add** or **Decline**.
- **Pending Sent**:
  - Shows requests you sent that are awaiting the friend's acceptance.
  - Option to **Cancel / Nudge**.

### Receiver's Approval Modal
- Displays proposed amount and details.
- Allows the recipient to select which of **their own custom budget categories** this expense belongs to before committing it to their budget.

---

## 6. Supabase Architecture: Ephemeral / Zero-Waste Queue

To stay well within Supabase free-tier storage limits, active requests function as a transient message queue:

### 1. `friendships` Table
Permanent records of linked pairs:
- `id` (uuid, primary key)
- `user_id_1` (uuid, references auth.users)
- `user_id_2` (uuid, references auth.users)
- `status` (`'pending'`, `'accepted'`, `'declined'`)
- `created_at` (timestamptz)

### 2. `transaction_requests` Table (Ephemeral Queue)
Temporary holding area for unapproved transactions:
- `id` (uuid, primary key)
- `sender_id` (uuid, references auth.users)
- `receiver_id` (uuid, references auth.users)
- `amount` (numeric)
- `type` (`'lent'`, `'borrowed'`, `'settle'`)
- `note` (text)
- `created_at` (timestamptz)

> **Auto-Delete Rule**: When `status` changes to accepted or rejected, the client or a Supabase trigger deletes the row immediately. Only pending, unread transactions occupy cloud storage.

---

## 7. Settlement Flow ("Settle Up")
When Hardik repays Abhinav:
1. Hardik or Abhinav taps **"Settle Up"** in their People view.
2. A settlement request is sent to the other person.
3. Once accepted, both devices record the repayment and reset the balance to ₹0.
