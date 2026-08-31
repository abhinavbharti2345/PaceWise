# PaceWise

An intelligent student budgeting app designed to help you manage your monthly allowance, daily spending, carry-forward balance, and shared expenses.

> **Spend smarter. Stay on pace.**

## ✨ Features

- 🔐 **Email/Password Authentication** – Secure login and signup.
- 💰 **Monthly Budget Management** – Set your total allowance and track it across the month.
- 📊 **Daily Spending Budget** – Dynamically calculates how much you can spend *today*.
- 🔄 **Carry-Forward Budgeting** – Unspent daily allowance carries forward to future days.
- 📅 **Month-End Rollover** – Automatically carry your unspent balance into your next budget period.
- 💸 **Expense & Income Tracking** – Log transactions with categories, dates, and payment methods.
- 👥 **People / Debt Tracking** – Track who owes you and who you owe, complete with settlement flows.
- 📈 **Spending Insights** – Visual breakdowns of your spending habits and category totals.
- 👤 **Profile Management** – Manage your display name and account settings.
- 🎨 **Light / Dark / System Themes** – Beautiful, native-feeling UI in any lighting condition.
- 📱 **Responsive Mobile Interface** – Highly optimized for touch devices with safe-area handling.
- ☁️ **Supabase Cloud Persistence** – Real-time, isolated cloud database syncing.

## 🛠️ Tech Stack

- **React** – UI Library
- **TypeScript** – Type safety
- **Vite** – Build tool
- **Tailwind CSS** – Styling
- **Zustand** – Global state management
- **Supabase** – Backend (PostgreSQL, Auth, RLS)
- **Recharts** – Data visualization
- **Lucide React** – Iconography
- **Vitest** – Integration testing
- **Vercel** – Production deployment

## 🏗️ Architecture

PaceWise is a heavily client-optimized Single Page Application (SPA). 

**Data Flow:**
1. **Authentication:** Supabase handles secure Email/Password authentication.
2. **PostgreSQL / RLS:** The database enforces Row Level Security, ensuring users can only read/write their own rows.
3. **Zustand State:** Once authenticated, user data is fetched into a global Zustand store.
4. **Offline Resilience:** The store caches data locally (`pacewise-storage-${userId}`), allowing for instant optimistic UI updates before syncing back to the cloud.

## 🔐 Authentication

PaceWise uses Supabase Auth for its security layer. 
- **Supported:** Email signup, email confirmation, email login, password reset, and session restoration.
- **Data Isolation:** User sessions are strictly isolated. Upon logout, local state and caches are securely purged.
- **Note:** Google OAuth is intentionally disabled in the current production configuration.

## ☁️ Data & Persistence

Authenticated user data is robustly persisted in the Supabase PostgreSQL database. 

The application utilizes four primary tables, entirely isolated via Row Level Security (RLS):
- `profiles` – User display names and avatars.
- `budget_configs` – The user's active budget period, allowance, and theme settings.
- `transactions` – Every expense, income, and bill.
- `people` – Tracked friends and their rolling debt balances.

## 💰 Budget System

PaceWise answers the question: *"How much can I spend today?"*

- **Starting Allowance:** You set a total amount for the month.
- **Daily Budget:** The app divides your allowance across the days in your budget period.
- **Carry-Forward:** If your daily budget is ₹200 and you only spend ₹100, the remaining ₹100 is automatically carried forward to give you a larger budget tomorrow.
- **Month Rollover:** At the end of the month, unspent funds can be rolled over as a starting balance for the next month.

## 📱 Responsive Design

PaceWise looks and feels like a native application across all devices:
- **Desktop:** Features a persistent left-hand navigation sidebar and expansive card layouts.
- **Mobile/Tablet:** Transitions seamlessly to a compact bottom navigation bar. It is rigorously tested against Apple Human Interface Guidelines for 44px minimum touch targets and iOS Home Indicator safe areas.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/abhinavbharti2345/PaceWise.git
cd PaceWise
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory. You will need to provide your Supabase project credentials.
```env
VITE_SUPABASE_URL="your_supabase_project_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
```
*(Never commit your `.env` file or expose your Service Role keys!)*

### 4. Run the development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

## 🗄️ Supabase Setup

To use PaceWise, you need an active Supabase project. 

1. Create a new project on [Supabase](https://supabase.com).
2. Open the SQL Editor in your Supabase dashboard.
3. Copy the contents of `Docs/supabase-schema.sql` and run it. 
4. This script will automatically create the required tables, triggers, and RLS policies. 

*Note: Do not run the initial schema script multiple times on the same database, as it will attempt to recreate existing tables.*

## 🧪 Testing

PaceWise includes a rigorous integration test suite to verify mathematical calculations, user isolation, and state hydration.

```bash
npx vitest run
```
*(Current Audit Status: 15/15 tests passing)*

## 🌐 Deployment

PaceWise is optimized for deployment on Vercel. 
- SPA routing rewrites are configured in `vercel.json` so that deep-linking (e.g., navigating directly to `/transactions`) resolves correctly without returning 404 errors.
- Ensure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are added to your Vercel Environment Variables.

## 📁 Project Structure

```text
src/
├── components/      # Reusable UI components (buttons, modals, cards)
├── features/        # Complex business logic (e.g., budgetEngine.ts)
├── lib/             # Third-party integrations (Supabase client)
├── pages/           # Main route views (Dashboard, Transactions, etc.)
├── store/           # Zustand global state and persistence
├── utils/           # Helper functions (formatting, dates)
└── App.tsx          # Router configuration
```

## 🔒 Security Notes

- **Row Level Security (RLS):** All data is protected at the database level. Even if a user attempts to manipulate the API, Supabase will reject queries targeting another user's `user_id`.
- **Public Keys Only:** The frontend only uses the public `ANON_KEY`. 
- **Local Storage:** PaceWise stores encrypted session tokens and minimal cached state locally, all of which are destroyed upon user logout.
