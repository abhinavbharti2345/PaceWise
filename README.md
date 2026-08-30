# PaceWise

Student budgeting and debt tracking for managing a monthly allowance, daily spending pace, and money owed to or from friends.

PaceWise is designed around a simple question: how much can I safely spend today? The app combines monthly allowance tracking, daily budget calculations, fixed bills, and informal debt management in one lightweight workspace.

## Overview

PaceWise is a student-focused personal finance app for people who receive a fixed monthly budget and want to pace spending over time instead of reacting to historical expenses after the fact.

The current implementation is a client-side React application with local persistence. It lets a user:

- set a monthly starting allowance
- add income, expenses, and bills
- track daily carry-forward and remaining allowance
- monitor how much is available to spend today
- track balances with people and settle debts
- review month-to-date spending insights

The product is intentionally focused and lightweight. It does not include backend sync, authentication, or bank integrations.

## Features

### Budgeting

- Monthly allowance configuration with currency selection
- Base daily budget calculation from the current month window
- Carry-forward logic for underspending from previous days
- Money left calculation based on income, bills, and spending
- Overspending status when today exceeds the recommended daily pacing

### Transactions

- Add expense transactions with category, reason, date, and payment method
- Add income transactions with source and date
- Record bill payments separately from general spending
- Search and filter transactions by type and time range
- Delete transactions from the history view

### People & Debts

- Add people and track balances individually
- Track money you have given or taken
- View a person detail page with full history
- Record settlement flows and debt repayment history

### Insights

- Monthly summary cards for starting allowance, income, bills, and spend
- Category breakdown for spending
- Largest outflow indicators
- Pacing health and average daily spending comparisons

### Theme & Responsive UI

- Light, dark, and system theme modes
- Desktop sidebar navigation and mobile bottom navigation
- Responsive layouts optimized for both desktop and phone-sized screens

## How It Works

The core budgeting logic lives in [src/features/budget/budgetEngine.ts](src/features/budget/budgetEngine.ts). It calculates a month-based spending pace from the configured allowance and recorded transactions.

At a high level:

- Effective total budget = starting allowance + income - bills
- Base daily budget = effective total budget / total days in the selected month
- Carry-forward = daily budget earned so far - discretionary spending up to yesterday
- Today’s available = base daily budget + carry-forward
- Money left = effective total budget - prior spending - spending today

This creates a pacing model where unused daily allowance can roll forward instead of disappearing at the end of the day.

Example:

```text
Monthly allowance: ₹6,000
Days in month: 30
Base daily budget: ₹200/day

If you spend ₹100 on day 1, your carry-forward becomes ₹100 for day 2.
```

The app treats person debt separately from ordinary spending:

- a transaction marked as gave is treated as a cash outflow
- a settlement transaction marked as took is treated as cash inflow
- balances are maintained per person and displayed as positive or negative values

## Tech Stack

The project is built with the following technologies already present in the repository:

- React 19
- Vite 8
- TypeScript
- React Router DOM
- Zustand for state management and persistence
- Tailwind CSS 4
- date-fns for date handling
- lucide-react for icons
- Vitest for tests
- oxlint for linting

## Project Structure

```text
PaceWise/
├── Docs/
│   ├── Pace_Stitch_Design_Prompts.md
│   ├── Student_Money_Tracker_PRD.md
│   └── Student_Money_Tracker_UIUX.md
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── layout/
│   │   ├── modals/
│   │   └── ui/
│   ├── features/
│   │   └── budget/
│   │       └── budgetEngine.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Insights.tsx
│   │   ├── People.tsx
│   │   ├── PersonDetails.tsx
│   │   ├── Settings.tsx
│   │   └── Transactions.tsx
│   ├── store/
│   │   └── useStore.ts
│   └── utils/
│       ├── categoryHelpers.ts
│       └── cn.ts
├── tests/
│   └── budget/
│       ├── budgetEngine.test.ts
│       └── comprehensiveEngine.test.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
└── .gitignore
```

## Getting Started

### Prerequisites

Use a recent Node.js LTS version. This project is configured as a Vite React app and currently relies on the dependencies listed in [package.json](package.json).

### Install

```bash
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

### Preview build locally

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Environment Variables

No environment variables are currently required by this project.

The app runs entirely in the browser and persists data locally via Zustand. There is no backend service, API configuration, or .env file in the repository.

## Development

The project is a front-end application with local state persistence and no separate backend service.

Main implementation points:

- app routing and theme handling: [src/App.tsx](src/App.tsx)
- app-wide persisted state: [src/store/useStore.ts](src/store/useStore.ts)
- daily budgeting logic: [src/features/budget/budgetEngine.ts](src/features/budget/budgetEngine.ts)
- dashboard flow: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
- people and debt tracking: [src/pages/People.tsx](src/pages/People.tsx)
- settings and theme controls: [src/pages/Settings.tsx](src/pages/Settings.tsx)

## Testing

The repository includes unit tests for the budget engine, including carry-forward behavior, income and bill adjustments, and overspending detection.

Run the test suite with:

```bash
npx vitest run
```

The current tests live in:

- [tests/budget/budgetEngine.test.ts](tests/budget/budgetEngine.test.ts)
- [tests/budget/comprehensiveEngine.test.ts](tests/budget/comprehensiveEngine.test.ts)

## Architecture

The app uses a simple client-side architecture:

- UI screens are implemented as page components under [src/pages](src/pages)
- modal forms handle adding transactions and people
- shared app state is stored in Zustand and persisted to local storage
- business rules are centralized in the budget engine
- theme and navigation are handled in the app shell and global CSS

This keeps the product lightweight while making budgeting logic easy to test independently.

## Roadmap

The following items are planned based on the product documentation and are not fully implemented in the current codebase:

- cloud sync / multi-device accounts
- export/import data
- recurring bills and subscriptions
- refund tracking
- savings goals
- richer charts and trend analysis
- richer notifications and reminders

These are documented in [Docs/Student_Money_Tracker_PRD.md](Docs/Student_Money_Tracker_PRD.md) and [Docs/Student_Money_Tracker_UIUX.md](Docs/Student_Money_Tracker_UIUX.md), but are not yet implemented in the current repository state.

## Contributing

Contributions are welcome for bug fixes, UX improvements, and additional budgeting features.

A reasonable workflow is:

1. Fork the repository
2. Create a feature branch
3. Install dependencies with `npm install`
4. Make focused changes
5. Run `npx vitest run` and `npm run build`
6. Open a pull request with a clear summary

## License

No license file is currently present in this repository, so the project does not currently declare an open-source license.

## Acknowledgements

This project makes use of:

- React
- Vite
- Tailwind CSS
- Zustand
- date-fns
- lucide-react

These libraries are already included as dependencies in [package.json](package.json).
