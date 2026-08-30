# 💰 PaceWise

> **Spend smarter. Stay on pace.**

PaceWise is a student-focused budgeting app that helps you understand how much you can safely spend each day. Track your allowance, expenses, bills, income, and money owed between friends — all in one clean workspace.

## ✨ What PaceWise does

### 💸 Smart Daily Budget

PaceWise turns a monthly allowance into an adaptive daily spending limit. It keeps track of what remains, what has already been spent, and how much can be carried forward to future days.

### 🧾 Track Your Spending

Add expenses with a category, reason, date, and payment method. Bills are tracked separately from everyday spending so your monthly budget stays realistic.

### 👥 Keep Track of People

Track who owes you, who you owe, and the full history behind each balance. The app supports person-level transactions and settlement flows for informal debts.

### 📊 Understand Your Spending

The Insights page summarizes the month’s allowance, fixed bills, income, category breakdown, and pacing health so you can adjust spending before the month slips away.

### 🌗 Light & Dark Mode

Choose between light, dark, or system theme settings to fit your day and screen.

### 📱 Built for Desktop & Mobile

The interface is responsive, with a desktop sidebar and mobile-friendly bottom navigation so it works across devices.

## 🧠 The PaceWise difference

Traditional expense trackers usually answer:

> “Where did my money go?”

PaceWise answers a more useful question:

> “How much can I spend today?”

The app focuses on pacing rather than just historical tracking. Unspent daily allowance can carry forward, and changes like income or bills are reflected in the budget logic automatically.

## 💰 How the daily budget works

The core idea is simple:

- Set your monthly allowance
- Divide it across the month
- Carry forward unused daily budget when you spend less than your target
- Adjust the available amount when bills or extra money come in

Example:

```text
Monthly allowance: ₹6,000
Days in month: 30
Daily budget: ₹200

If you spend only ₹100 today,
your unused ₹100 carries forward.

Tomorrow: ₹200 + ₹100 = ₹300 available
```

Bills and income also affect the budget in real time, so the daily pace stays aligned with the month’s actual financial picture.

## 👥 People & debts

The People section helps you keep informal money relationships clear:

- money you gave someone
- money you took from someone
- amounts to receive
- amounts to give
- individual balances and history
- settlement and repayment tracking

Example:

- 🟢 Rahul — you receive ₹500
- 🔴 Aman — you give ₹300

Each person has their own transaction timeline and current outstanding balance.

## 📱 Features at a glance

| Feature | Status |
|---|---|
| 💰 Monthly allowance | ✅ |
| 📅 Daily budget | ✅ |
| 🔄 Carry-forward | ✅ |
| 💸 Expense tracking | ✅ |
| 💵 Income tracking | ✅ |
| 🧾 Bills | ✅ |
| 👥 People & debts | ✅ |
| 📜 Transactions | ✅ |
| 📊 Insights | ✅ |
| 🌗 Light / Dark / System theme | ✅ |
| 📱 Responsive UI | ✅ |

## 🎨 Design

PaceWise is designed to feel clean and easy to scan. The app emphasizes clarity over clutter, with strong financial states, minimal friction, and a lightweight student-first visual language.

## 🛠️ Tech stack

- ⚛️ React
- 📘 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🗃️ Zustand
- 📅 date-fns
- 🧪 Vitest

## 🚀 Getting started

### Requirements

- Node.js LTS

### Installation

```bash
git clone https://github.com/abhinavbharti2345/PaceWise.git
cd PaceWise
npm install
```

### Run locally

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## ✅ Current status

PaceWise is a working personal budgeting app with local persistence, daily pacing logic, debt tracking, and spending insights. It is intentionally focused on the student budgeting workflow rather than bank sync or multi-user cloud features.

## Roadmap

The project documentation outlines a few future ideas that are not part of the current implementation, including:

- cloud sync
- export / import
- recurring bills
- savings goals
- richer analytics and trends

Those are documented in the project’s design and PRD notes, but they are not currently implemented in this codebase.
