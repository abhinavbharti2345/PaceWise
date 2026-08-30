**Student Money Tracker**

_UI/UX Design Specification_

Version 1.0 • August 2026 • Status: Draft for review

# 1\. Design Objective

The interface should be a modern, minimal, student-focused money tracker. The user should be able to open the app and immediately understand how much money they have, how much they can spend today, what they recently spent, and their outstanding money with other people. The UI should prioritize clarity and speed over complex financial terminology.

# 2\. Main Navigation

The application has five primary sections:

- 🏠 Dashboard — daily budget and current financial snapshot.
- 💸 Transactions — complete transaction history.
- 👥 People — money the user owes or should receive.
- 📊 Insights — spending analysis and trends.
- ⚙️ Settings — preferences, notifications, and data controls.

Desktop: use a left sidebar. Mobile: use a bottom navigation bar. The People → Person Details screen is a sub-page and should not appear as a separate main navigation item.

# 3\. Global UI Structure

## 3.1 Desktop

Recommended structure: fixed/comfortable left sidebar around 220–250px, with the main content centered and constrained to a readable maximum width.

Suggested sidebar order: Logo/brand → Dashboard → Transactions → People → Insights → Settings.

## 3.2 Mobile

Use a bottom navigation bar for the five primary sections. Add Expense should be accessible through a prominent floating action button or persistent quick action.

# 4\. Dashboard Layout

The Dashboard is the most important screen and should be optimized for daily use.

## 4.1 Top

- Greeting / date.
- Current month.
- Primary Money Left card.

Suggested hierarchy: August 2026 → Money Left — ₹3,800 → Starting/total monthly money — ₹6,000 → Progress indicator showing remaining budget.

## 4.2 Today's Budget

Place the daily budget information directly below the main money card:

- Today's Available Budget — e.g. ₹253.
- Spent Today — e.g. ₹150.
- Days Remaining — e.g. 22.
- Carry Forward — e.g. +₹80.

The distinction between Base Daily Budget, Carry Forward, and Today's Available Budget must be understandable from the UI, not just from documentation.

## 4.3 Quick Actions

- \+ Add Expense
- \+ Add Money

## 4.4 Today's Spending

Show a simple progress indicator such as ₹150 / ₹253, with a progress bar and a clear overspending state when applicable.

## 4.5 Recent Transactions

Show the latest few transactions in compact rows, with a View All action, e.g.:

- 🍔 Dinner — -₹150
- 💳 Credit Card — -₹1,000
- 🚌 Bus — -₹40

## 4.6 People Summary

Show a compact summary near the bottom of the Dashboard:

- You Owe — ₹300
- To Receive — ₹850
- View People →

# 5\. Add Expense UI

Add Expense should preferably open as a modal or bottom sheet instead of forcing the user through a full page.

- Amount — largest input on the screen.
- Category — selectable list.
- Reason / Description — short text field.
- Date — defaults to today.
- Payment Method — optional.
- Note — optional.
- Save / Add Expense button.

The form should be fast to complete because recording an expense is expected to be one of the most frequent actions in the app.

# 6\. Add Money UI

Use the same modal/bottom-sheet pattern as Add Expense.

- Amount
- Source — parents, salary, scholarship, other
- Date
- Note
- Add Money button

# 7\. Transactions Page

## 7.1 Top Controls

- Page title: Transactions
- Search
- Filters: All / Expenses / Income / Bills
- Date filter: Today / Week / Month / Custom

## 7.2 Transaction List

Use compact rows rather than large cards so many transactions can be viewed at once:

- Category/icon
- Transaction name or reason
- Date/time when useful
- Amount aligned to the right
- Positive/negative state

# 8\. People Page

## 8.1 Top Summary

The top of the page should immediately show:

- You Owe — total amount the user needs to pay.
- To Receive — total amount other people owe the user.
- Net — optional combined position.

Recommended wording: ₹300 You Owe | ₹850 To Receive | Net +₹550

## 8.2 People List

Below the summary, show all people with their current balance:

- Rahul — +₹500 — Dinner
- Aman — -₹300 — Cab
- Karan — +₹350 — Tickets

Positive balance means the user should receive money. Negative balance means the user owes money.

## 8.3 Add Person Transaction

Provide a prominent + Add Transaction action:

- Person
- Amount
- I gave money / I took money
- Reason
- Date
- Optional note

# 9\. Person Details Page

Clicking a person opens a dedicated details screen showing the current balance and complete history with that person.

## 9.1 Header

- Back → People
- Person name
- Current status: You will receive / You owe
- Current outstanding amount

## 9.2 Primary Actions

The action should adapt to the current balance:

- If the person owes the user → Receive Money.
- If the user owes the person → Give Money.
- Add Transaction should remain available.

## 9.3 History

Show a chronological history, for example:

- Aug 30 — Gave Rahul ₹500 — Dinner — +₹500 owed
- Aug 31 — Received ₹200 — Partial repayment — -₹200
- Remaining — ₹300

## 9.4 Settlement

Allow full settlement and partial repayment. Do not delete historical transactions when a debt is settled.

# 10\. Insights Page

Insights should explain spending behavior without becoming overly complex:

- Monthly spending total
- Money remaining
- Category breakdown
- Daily/weekly spending trend
- Top spending categories
- Optional monthly comparison

Recommended sections: August Overview, Spending by Category, Daily Spending Trend, Top Spending.

# 11\. Settings Page

Keep Settings simple and grouped:

- Budget — monthly budget, month start, currency.
- Appearance — Light / Dark / System.
- Notifications — daily reminders and budget warnings.
- Data — export, import, delete/reset data.

# 12\. Global Visual Design

## 12.1 Design Language

- Modern
- Minimal
- Friendly
- Student-oriented
- High readability
- Fast interaction

## 12.2 Components

- Rounded cards for important summaries.
- Compact list rows for transactions.
- Large typography for money values.
- Clear primary buttons.
- Subtle progress bars.
- Small icons for categories.
- Modal/bottom-sheet forms for quick actions.

## 12.3 Semantic Money States

| **State**         | **Meaning**                                  |
| ----------------- | -------------------------------------------- |
| Green / positive  | Money to receive or positive budget movement |
| Red / negative    | Money owed, spending, or overspending        |
| Neutral / primary | Budget and balance information               |

Color should never be the only indicator; pair it with labels, signs, and icons.

# 13\. Responsive Design

The app should be designed for both desktop and mobile from the beginning:

- Desktop: sidebar + centered main content.
- Tablet: compact sidebar or responsive navigation.
- Mobile: bottom navigation + floating/obvious Add Expense action.
- Forms: modal or bottom sheet on mobile.
- Money values should remain highly visible at every screen size.

# 14\. User Flow

- Open Dashboard → see Money Left + Today's Available Budget.
- Spend money → Add Expense → amount + category + reason → save.
- Daily budget updates automatically.
- Unused allowance carries forward.
- Pay a bill → Add Bill/Payment → remaining monthly budget and daily calculation update.
- Receive more money → Add Money → budget updates.
- Lend/borrow → People → select person → give/take → reason → save.
- Repay/receive → Person Details → Give Money / Receive Money → full or partial settlement.
- Review behavior → Insights.

# 15\. Navigation Summary

- 🏠 Dashboard
- 💸 Transactions
- 👥 People
  - ↳ Person Details
- 📊 Insights
- ⚙️ Settings

Global actions:

- \+ Add Expense
- \+ Add Money

# 16\. Design Priorities

- 1\. Dashboard clarity — the user should understand their financial position in seconds.
- 2\. Fast expense entry — recording spending should take very few interactions.
- 3\. Clear People balances — immediately distinguish You Owe vs To Receive.
- 4\. Strong transaction history — every important action should be traceable.
- 5\. Simple Insights — useful information without financial-app complexity.
- 6\. Responsive design — equally usable on a phone and desktop.

# 17\. Next UI Work

The next design step is low-fidelity wireframes for the Dashboard, Add Expense, Transactions, People, and Person Details screens. After the wireframes are approved, define the visual design system (typography, spacing, colors, buttons, cards, icons, states, and dark mode) before frontend implementation.