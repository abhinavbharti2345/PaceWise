# PaceWise — Stitch Design Prompts

Reference style: dark hero card + light dashboard shell, bold rupee numbers, rounded cards, red/orange/green semantic accents. Paste the **Global Design System** block into every prompt (or Stitch's style/brand field once), then paste the page-specific block for each screen.

---

## 0. Global Design System (paste into every prompt)

```
Design a fintech mobile-and-web app called "PaceWise" for students.
Tagline: "Track. Pace. Prosper."

STYLE: Modern, clean, minimal, student-friendly fintech UI. Not a stiff corporate
bank app — friendly, confident, a little playful, high readability, generous
white space, soft rounded corners (16–20px radius on cards, 12px on buttons/inputs).

COLOR PALETTE:
- Primary Red: #FF3B30 (used for the hero "Money Left" card background as a
  dark-red gradient, the primary Add Expense button, and negative/expense states)
- Orange: #FFB400 (bills, warnings, secondary accents)
- Success Green: #25C266 (positive states, money to receive, "on pace" messages,
  Add Money button outline/fill)
- Dark Neutral: #14171A (dark card backgrounds, dark mode base)
- Neutral grays: #7A7E85 (secondary text), #B5B9C0 (borders/dividers), #EDEFF2
  (light card fill), #FAFAFA (app background)
- White: #FFFFFF (surface/card background, text on dark)
Color is never the only signal — always pair with a +/− sign, icon, or label.

TYPOGRAPHY: Rounded/geometric sans-serif (e.g. Inter or similar). Money values
are the largest, boldest text on any screen (32–40px bold). Section labels are
small, uppercase or medium-weight gray text (11–13px). Body text 14–15px.

LAYOUT SYSTEM:
- Desktop: fixed left sidebar (approx 220–250px) with logo "PaceWise" mark
  (red rounded-square icon + wordmark), nav items with icon + label, active
  item highlighted with a solid red pill/background. Main content area is a
  card-grid dashboard, centered, max-width ~1100px, 20–24px gutters.
- Mobile: single column, bottom navigation bar with icons, floating/primary
  "+ Add Expense" accessible from a top quick-action bar or FAB.
- Cards: white rounded-2xl cards with soft shadow, 20–24px internal padding.
  The single exception is the "Money Left" hero card, which uses a dark
  red-to-black gradient background with white text.

COMPONENTS:
- Rounded pill buttons: solid red for primary destructive/expense actions,
  green outline or solid for positive/income actions, dark/black for neutral
  secondary actions.
- Small circular icon badges (colored soft-fill circle + icon) for category
  and transaction-type icons (food, bills, transport, etc.)
- Compact list rows with icon, title, subtitle, right-aligned amount in
  red (−) or green (+).
- Circular progress ring for "% of daily budget used."
- Thin sparkline / mini area chart in green for trend visuals.
- Small rounded avatar circles for people.
- Bottom-sheet / centered modal for all quick-add forms, with a big amount
  input at the top, rounded field groups below, and a full-width solid
  button at the bottom.

Generate high-fidelity, production-ready UI, not wireframes. Use realistic
sample data in Indian Rupees (₹).
```

---

## 1. Dashboard — Desktop

```
Design the DESKTOP DASHBOARD for PaceWise, using the Global Design System above.

LEFT SIDEBAR (approx 230px, light neutral background #F4F5F7, subtle right border):
- Top: "PaceWise" logo (rounded-square red icon with letter "P" + bold black wordmark "PaceWise")
- Nav list (vertical, rounded pill items):
  - 🏠 Dashboard (ACTIVE: solid red background #FF3B30, white icon and text, bold)
  - 💸 Transactions
  - 👥 People
  - 🏖️ Groups
  - 🏷️ Categories
  - 📊 Insights
  - 📖 Guide
  - ⚙️ Settings
- Bottom: User profile pill with avatar, "Abhinav B.", small gray email, and a tiny logout icon.

MAIN CONTENT AREA (centered, ~1050px max width):
1. TOP BAR: Greeting "Good morning, Abhinav 👋" (bold 24px) with subtitle
   "Here's your spending pace for November 2026." On the right, a live clock chip.

2. HERO "MONEY LEFT" CARD (full width or 2/3 width, dark red-to-black gradient
   #2D0B0A to #14171A, white text, 24px padding, rounded-2xl):
   - Small label: "TOTAL MONEY LEFT" (uppercase, soft red/white)
   - Giant bold value: "₹4,250" (38px, bold)
   - Secondary info: "of ₹8,000 monthly allowance • 22 days remaining"
   - Thin horizontal progress bar showing ~53% remaining (filled portion in vibrant red).

3. DAILY PACE & CARRY-FORWARD ROW (grid of 2 cards):
   - Card A: "Today's Available Budget" — large bold number "₹340", with a circular progress ring
     showing ₹120 spent out of ₹340 (35% used). Caption: "₹220 left for today".
   - Card B: "Carry-Forward Balance" — prominent green pill badge "+₹80 Saved", with subtitle
     "Carried over from yesterday's underspending. Keep it up!"

4. QUICK ACTIONS ROW: Three rounded pill buttons side by side:
   - "+ Add Expense" (solid red #FF3B30, white text)
   - "+ Add Money" (green outline, green text)
   - "+ Add Bill" (orange outline, orange text)

5. SPLIT SECTION (2 columns):
   - Left column (People Debt snapshot): Title "Friends & Debts", showing "To Receive: ₹850" (green)
     and "You Owe: ₹300" (red) with avatars and quick link "View People →".
   - Right column (Recent Transactions): Title "Recent Activity", 4 compact rows (e.g. 🍔 Dinner -₹150,
     🚇 Metro -₹40, ☕ Coffee -₹60, ⚡ Electricity Bill -₹500).
```

---

## 2. Transactions Screen

```
Design the TRANSACTIONS page for PaceWise, using the Global Design System.

HEADER: "Transactions" with search bar and filter controls:
- Search input with magnifying glass: "Search expenses, bills, friends..."
- Filter pills (horizontal scroll): "All", "Expenses", "Bills", "Income", "People".
- Date range pills: "Today", "This Week", "This Month", "Custom Range".

TRANSACTION FEED (Card with clean separated list rows):
- Row 1: 🍔 "Dinner with Friends" • Food • 30 Nov • Paid via UPI • Right: "-₹240" in red
- Row 2: 💵 "Pocket Money / Allowance" • Parents • 28 Nov • Bank Transfer • Right: "+₹5,000" in green
- Row 3: ⚡ "Hostel Wi-Fi" • Bill • 25 Nov • Right: "-₹600" in orange
- Row 4: 👥 "Cab to College (Split with Rahul)" • Lent • Right: "+₹120" in green badge

Hover states with subtle Edit (pencil) and Delete (trash) icons on the far right.
```

---

## 3. People & 1-on-1 Debt Ledger

```
Design the PEOPLE page for PaceWise, using the Global Design System.

TOP SUMMARY BANNER (Split rounded card):
- Left side: "To Receive" • giant bold green "₹1,250" • caption "3 friends owe you"
- Right side: "You Owe" • giant bold red "₹400" • caption "1 friend"
- Net indicator: "Net Balance: +₹850"

PEOPLE LIST:
- Card 1: Avatar "Rahul S." • "Rahul owes you ₹650" • green chip "+₹650" • action: "Settle" button
- Card 2: Avatar "Aman K." • "You owe Aman ₹400" • red chip "-₹400" • action: "Pay Back" button
- Card 3: Avatar "Priya M." • "Priya owes you ₹600" • green chip "+₹600" • action: "Settle" button

FLOATING / BOTTOM ACTION: "+ Add Person / Debt" prominent pill button.
```

---

## 4. Groups & Shared Expenses

```
Design the GROUPS screen for PaceWise, using the Global Design System.

TOP BAR: Title "Groups" with subtitle "Split trips, flats, and outings with minimal transfers."
Right-hand button: "+ Create Group" in red.

ACTIVE GROUPS GRID (cards):
- Card 1: Emoji "🏖️ Goa Trip 2026" • 4 members • Status: "Active"
  - Total Spend: "₹18,400"
  - Your Share: "₹4,600" • You Paid: "₹6,000"
  - Net badge: "You are owed ₹1,400" in bold green
- Card 2: Emoji "🏠 Flat 302 Groceries" • 3 members • Status: "Active"
  - Total Spend: "₹3,200"
  - Net badge: "You owe ₹350" in red

GROUP DETAILS VIEW (when a card is clicked):
- Header with group emoji, title, total spend, and "Settle Group" button.
- "Simplified Settlements" card: visual flow arrows showing the minimal transfers:
  - "Aman pays You ₹1,050"
  - "Rohan pays You ₹350"
  - Caption: "Minimal transfers calculated automatically to settle all balances."
- Tabs: "Expenses (12)" and "Transfers (3)".
- "+ Add Group Expense" button at bottom.
```

---

## 5. Add Group Expense Modal

```
Design the ADD GROUP EXPENSE modal for PaceWise.

MODAL HEADER: "Add Group Expense" with close "×".

AMOUNT: Giant hero number input "₹1,800".

FIELDS:
- Description: "Seafood Shack Lunch"
- Paid by: Dropdown selector showing "You" (selected), "Rahul", "Aman", "Rohan".
- Split Method: Segmented toggle "Equal Split" vs "Custom Split".
- Members Checklist (under Equal Split):
  - [x] You (₹450)
  - [x] Rahul (₹450)
  - [x] Aman (₹450)
  - [x] Rohan (₹450)
- Date: "2 Nov 2026"

BOTTOM: Full-width solid red "Save Group Expense" button.
```

---

## 6. Categories Management Screen

```
Design the CATEGORIES management page for PaceWise.

TABS: "Expense Categories", "Bill Categories", "Income Sources".

CATEGORY LIST (Grid of neat rounded cards):
- Each card has:
  - Circular icon badge with its custom background color (e.g. 🍔 Food in Orange, 🚌 Transport in Blue)
  - Category Title ("Food & Dining")
  - Active transaction count badge ("48 entries")
  - Eye icon toggle (Hide/Show)
- "+ Add Custom Category" dashed card:
  - Opens modal with text title input, Lucide icon selector grid (30+ icons), and color swatches (10 colors).
```

---

## 7. Insights Page

```
Design the INSIGHTS analytics page for PaceWise.

PERIOD SELECTOR: Pill buttons: "Today", "This Week", "This Month" (active), "Custom".

TOP METRICS:
- Total Spent: "₹3,450"
- Daily Average: "₹164/day"
- Zero-Spend Days: "6 Days" (reward badge with flame or star icon).

SPENDING BREAKDOWN:
- Left: Donut chart with category slices (Food 40%, Transport 20%, Bills 25%, Leisure 15%).
- Right: Category breakdown list with colored dots, percentages, and totals.

DAILY SPENDING PACING CHART:
- Line/Bar chart showing daily spend against a green dashed "Ideal Daily Pace" line (₹250/day).
- Highlights overspending spikes in orange/red and underspending days in green.
```

---

## 8. Guide & Onboarding

```
Design the GUIDE & HELP page for PaceWise.

TITLE: "How PaceWise Works" • Subtitle: "The core philosophy behind daily allowance pacing."

ILLUSTRATED CARDS (3-step visual guide):
- Step 1: "Set Monthly Allowance" — Illustration of a student setting ₹6,000 allowance for 30 days = ₹200/day base limit.
- Step 2: "Carry-Forward Advantage" — Spend ₹120 today $\rightarrow$ leftover ₹80 rolls into tomorrow $\rightarrow$ tomorrow's budget is ₹280!
- Step 3: "Bills Recalculate Automatically" — Pay a ₹1,000 rent or fee $\rightarrow$ remaining daily allowance automatically adapts without manual spreadsheets.
- Step 4: "Friends & Group Splits" — Track informal debts and settle group trips with 1 tap.
```

---

## 9. Auth Screens (Login & Signup)

```
Design the AUTHENTICATION screens for PaceWise.

CLEAN MINIMAL CARD (Centered, 420px wide):
- Logo: Bold red "PaceWise" logo mark + "Track. Pace. Prosper."
- Title: "Welcome back" or "Create your account".
- Inputs: Clean rounded boxes with icons for Email and Password.
- Primary Action: Full-width solid red button "Sign In" / "Create Account".
- Switcher: "Don't have an account? Sign up"
- Security Note: "🔒 Protected by Supabase Row-Level Security".
```
