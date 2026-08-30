**Student Money Tracker**

_Product Requirements Document (PRD)_

Version 1.0 • August 2026 • Status: Draft for review

# 1\. Overview

Student Money Tracker is a simple, student-focused web application for managing a fixed amount of money throughout the month. It exists to answer four questions quickly:

- How much money do I have left?
- How much can I spend today?
- Where did my money go?
- Who owes me money, or who do I owe?

Its defining feature is a dynamic daily spending allowance: unused money carries forward to future days, while bills and other major payments reduce the remaining monthly budget and automatically recalculate the amount available per day.

# 2\. Problem Statement

Students typically receive a fixed amount of money for the month (allowance, scholarship, part-time income) and struggle to pace spending across the month. General-purpose finance apps are built for adults with bank integrations, investments, and complex categorization — too heavy for a student who just wants to know: "Given the money I have and the days remaining, how much can I safely spend today?"

# 3\. Goals

- Make daily spending decisions easy and fast.
- Turn a monthly allowance into an understandable daily spending limit.
- Reward underspending by carrying unused daily allowance forward.
- Automatically adapt the daily allowance when money is spent on bills or other planned payments.
- Record the reason behind every expense so the user can understand spending habits.
- Track money lent to and borrowed from other people, separate from normal expenses.
- Provide a clear monthly picture without the complexity of professional finance software.

# 4\. Non-Goals (V1)

- Bank account / card integrations or automatic transaction import.
- Investment tracking, credit score, or loan management.
- Multi-currency or multi-account support.
- Cloud sync or multi-device accounts (see Section 12, V2+).

# 5\. Target User

Primary persona: a student managing a fixed monthly allowance or limited income, who wants a lightweight, non-intimidating way to pace daily spending and keep track of informal debts with friends — not a full personal-finance suite.

# 6\. Core Budget Concept

## 6.1 Monthly Starting Money

At the beginning of a budget period, the user enters the amount of money available for the month. Example: ₹6,000.

## 6.2 Base Daily Budget

The initial daily budget is calculated from the money available and the number of budget days. For a 30-day month: ₹6,000 ÷ 30 = ₹200 per day.

## 6.3 Carry-Forward

If the user spends less than the day's available allowance, the unused amount becomes carry-forward money for the next day.

| **Item**                    | **Value**          |
| --------------------------- | ------------------ |
| Daily budget                | ₹200               |
| Spent                       | ₹100               |
| Unused                      | ₹100               |
| Next day's available budget | ₹200 + ₹100 = ₹300 |

## 6.4 Dynamic Recalculation

When a bill or significant payment is recorded, it reduces the money remaining in the monthly budget. The app then recalculates the base daily budget using the remaining budget and remaining days.

| **Item**         | **Value**              |
| ---------------- | ---------------------- |
| Starting money   | ₹6,000                 |
| Bill / payment   | ₹1,000                 |
| Remaining budget | ₹5,000                 |
| Days remaining   | 25                     |
| New daily budget | ₹5,000 ÷ 25 = ₹200/day |

## 6.5 Three Budget Values

The interface must distinguish between:

- Base Daily Budget — the normal amount available for a day.
- Carry-Forward — saved or deficit amount transferred from previous days.
- Today's Available Budget — Base Daily Budget + Carry-Forward.

This distinction prevents the app from confusing the user's actual bank/cash balance with the amount the budgeting system recommends spending today.

# 7\. Budgeting Philosophy

The app distinguishes between two concepts:

- Actual Money Balance — the money the user physically has available.
- Spending Allowance — the amount the budgeting system recommends spending today.

Example: a user might physically have ₹3,800 but have only ₹253 as today's recommended spending allowance. Keeping these concepts separate is a core product principle, not just a UI detail.

# 8\. Functional Requirements

## 8.1 Expense Tracking

Users can record normal spending through an Add Expense action, capturing:

- Amount (required)
- Category (required)
- Reason / Description (required)
- Date (required, defaults to today)
- Payment method (optional)
- Note (optional)

Suggested categories: Food, Transport, Education, Hostel / Rent, Recharge, Entertainment, Shopping, Snacks, Games, Fitness, Other. Users must also be able to create custom categories.

## 8.2 Bills & Major Payments

Bills are represented separately from ordinary discretionary expenses (e.g. credit-card payments, subscriptions, hostel payments, recharges, other fixed payments). The system must record that money was paid toward a bill rather than treating it like discretionary spending, both for budgeting (Section 6.4) and reporting purposes.

## 8.3 Adding Money

Users can add money at any time, not only at the start of the month, capturing:

- Amount (required)
- Source — e.g. parents, salary, scholarship, other (required)
- Date (required)
- Note (optional)

Additional money received during the month must update the remaining budget and the daily calculation.

## 8.4 People / Money Owed

A dedicated People section tracks money exchanged with other individuals, separate from ordinary personal spending.

- Person name (required)
- Amount (required)
- Direction: I gave money / I took money (required)
- Reason (required)
- Date (required)
- Optional note

Direction meaning: "I gave money" means the person owes the user. "I took money" means the user owes the person.

People Summary must show at the top of the section: total money to receive, total money to give, and net amount.

## 8.5 Settlements

Debts must not simply be deleted when settled. The system must support marking debts as settled and, ideally, partial repayments.

- Full settlement example: ₹500 owed → ₹500 received → Settled.
- Partial settlement example: ₹500 owed → ₹200 received → ₹300 remaining.

## 8.6 Dashboard

The Dashboard is the primary daily screen and must prioritize the most useful numbers:

- Money Left
- Today's Available Budget
- Spent Today
- Days Remaining
- Carry-Forward
- Quick Add Expense button
- Quick Add Money button
- People summary: To Receive / To Give

Illustrative values: Money Left ₹3,800; Available Today ₹253; Spent Today ₹150; Days Remaining 22; Carry-Forward +₹80; People: To Receive ₹850 | To Give ₹300.

## 8.7 Transactions

A chronological history must show all financial activity: expenses, income / money received, bills / payments, and people-related transactions.

Required filters:

- All / Expenses / Income / Bills / People
- Today / This Week / This Month / Custom Date Range
- Category
- Person

## 8.8 Monthly Overview & Statistics

A monthly overview must summarize:

- Starting money
- Additional money received
- Bills / major payments
- Normal expenses
- Money remaining
- Days passed and remaining
- Current base daily budget
- Current carry-forward
- Today's available budget

Later versions can add: spending by category, daily spending trend, highest-spending categories, monthly comparisons, and simple charts.

## 8.9 Navigation

- Home — daily budget and overall snapshot.
- Transactions — complete financial history.
- People — money owed to/from other people.
- Stats — monthly spending and trends.
- Settings — currency, budget preferences, notifications, data controls.

# 9\. Recommended Improvements (Post-V1 Candidates)

- Refund handling — record refunds as financial events instead of editing history.
- Overspending handling — allow recording an expense even when over budget; carry the deficit forward.
- Adding money mid-month — automatically incorporate new income into the remaining budget.
- Savings goal — optionally set a target amount to keep at the end of the month.
- Daily reminders — optionally show the current available amount.
- Spending streaks — optional motivational feature for staying under budget.
- Recurring bills — useful for subscriptions and predictable payments.
- Export/import — allow users to keep a backup of their data.

# 10\. Development Scope

## V1 — Core Product

- Monthly money
- Add money
- Add expense
- Daily budget calculation
- Carry-forward system
- Dynamic recalculation
- Bills / payments
- Expense reasons
- Categories
- Transaction history
- People and money owed
- Settlements
- Dashboard

## V1.5

- Partial settlements
- Better filters
- Monthly history
- Basic statistics

## V2+

- Charts
- Savings goals
- Notifications
- Recurring bills
- Refunds
- Export / import
- Cloud synchronization
- PWA / mobile installation

# 11\. Product Design Direction

The visual style should feel modern, friendly, and student-oriented rather than like a traditional banking application. The interface should minimize friction: large key numbers, a prominent Add Expense action, clear positive/negative money states, and simple explanations for how today's budget was calculated. See the companion UI/UX Design Specification for detail.

# 12\. Core Product Principle

**_The app is not only a record of where money went. Its main purpose is to answer: "Given the money I have and the days remaining, how much can I safely spend today?"_**

# 13\. Open Questions / Next Decisions

Before implementation begins, the following should be finalized:

- Exact budget algorithm and all edge cases.
- Rules for overspending and deficit carry-forward.
- Rules for adding money during a month.
- Rules for bills, refunds, and settlements.
- Month boundaries and treatment of different month lengths.
- Wireframes for each major page (see UI/UX Design Specification).
- Underlying data model and transaction types.
- Technology stack and storage approach.