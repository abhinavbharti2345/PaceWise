# Pace — Money Tracker
## Stitch Design Prompts (per page)

Reference style: dark hero card + light dashboard shell, bold rupee numbers, rounded cards, red/orange/green semantic accents. Paste the **Global Design System** block into every prompt (or Stitch's style/brand field once), then paste the page-specific block for each screen.

---

## 0. Global Design System (paste into every prompt)

```
Design a fintech mobile-and-web app called "Pace — Money Tracker" for students.
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
- Desktop: fixed left sidebar (approx 220–250px) with logo "P Pace" mark
  (red rounded-square icon + wordmark), nav items with icon + label, active
  item highlighted with a solid red pill/background. Main content area is a
  card-grid dashboard, centered, max-width ~1100px, 20–24px gutters.
- Mobile: single column, bottom navigation bar with 5 icons, floating/primary
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
Design the DESKTOP DASHBOARD for Pace, using the Global Design System above.

LEFT SIDEBAR (fixed, ~230px, white background, subtle right border):
- Top: "P" red rounded-square logo mark + "Pace" wordmark in red bold
- Nav items top to bottom, each with icon + label:
  Dashboard (active — solid red pill background, white icon/text),
  Transactions, People, Insights, Settings (all inactive — gray icon/text)
- Below nav, a "Total Balance" mini card: label "Total Balance", big value
  "₹3,800", small caption "Left this month", and a small calendar-style
  "Aug 2026" chip
- Bottom of sidebar: user row with avatar, name "Abhinav", subtitle "Premium"

TOP BAR (above main content):
- Left: greeting "Good morning, Abhinav 👋" and date "Monday, 31 August 2026"
- Right: two pill buttons "+ Add Money" (dark outline) and "+ Add Expense"
  (solid red), plus a notification bell icon with a red dot badge

MAIN CONTENT — Row 1 (3 cards):
1. MONEY LEFT card (large, ~40% width): dark red-to-black gradient background,
   white text. Label "MONEY LEFT" small caps top-left, a "..." menu icon
   top-right. Huge bold value "₹3,800". Caption "of ₹6,000" below. A thin
   white progress bar near the bottom showing money remaining.
2. TODAY'S BUDGET card: label "TODAY'S BUDGET", big value "₹253",
   caption "available". Below: "Spent today ₹150" on the left and a small
   circular progress ring on the right showing "59%" with caption "used".
3. CARRY FORWARD card: label "CARRY FORWARD", big green value "+₹80",
   caption "from yesterday", with a small green upward sparkline chart
   filling the bottom of the card.

MAIN CONTENT — Row 2 (3 cards):
1. QUICK ACTIONS card: label "Quick Actions", a 2x2 (or 4-across) grid of
   circular icon buttons with labels underneath: "+ Add Expense" (red icon),
   "+ Add Money" (green icon), "Pay Bill" (dark icon), "+ Add Person"
   (outline icon).
2. PEOPLE SUMMARY card: label "People Summary" with a "›" chevron top-right.
   Two rows: "To Receive" green label with value "₹850" and caption
   "3 people"; "To Give" red label with value "₹300" and caption "2 people".
3. UPCOMING BILLS card: label "Upcoming Bills" with "View all" link top-right.
   Two compact rows: "Credit Card Bill — ₹1,000 — Due in 5 days" and
   "Phone Recharge — ₹299 — Due in 12 days", each with a small colored icon.

MAIN CONTENT — Row 3 (2 cards):
1. RECENT TRANSACTIONS card (wider): label "Recent Transactions" with
   "View all" link. Compact list rows, each with a small colored circular
   icon, title + category subtitle, timestamp, and right-aligned amount in
   red: "Dinner / Food — Today, 8:15 PM — −₹150", "Credit Card Bill / Bills
   — Today, 12:30 PM — −₹1,000", "Bus / Transport — Today, 9:10 AM — −₹40".
2. BUDGET PACE card: label "Budget Pace" with "View all" link, headline
   "You're on pace! 🎉" in green, subtext "You are spending 8% less than
   your daily pace." A green mini area/line chart at the bottom comparing
   "Daily average ₹218" vs "This week avg ₹201".

Background of the main content area is very light gray/off-white (#FAFAFA).
All cards white with soft shadow and rounded corners, except the Money Left
hero card which is dark.
```

---

## 2. Dashboard — Mobile

```
Design the MOBILE DASHBOARD for Pace (portrait, ~390px width), same design
system as above, single-column, scrollable.

STATUS/TOP: time "9:41" mock status bar. Below it, header row: "Good
morning, Abhinav 👋" with a notification bell (red dot) top-right.

HERO CARD: full-width dark red-to-black gradient "MONEY LEFT" card,
huge white "₹3,800", caption "of ₹6,000", thin white progress bar.

Below hero, a 2-column stat row inside one rounded card, divided by a thin
vertical line:
- Left: "TODAY" label, "₹253" bold value, "available" caption
- Right: "SPENT" label, "₹150" value, small circular ring showing "59%"
  and caption "(59%)"

Below that, a "CARRY FORWARD" card: "+₹80 from yesterday" in green with a
small green sparkline on the right.

QUICK ACTIONS row: 4 circular icon buttons in a horizontal row with labels
beneath — "+ Add Expense", "+ Add Money", "Pay Bill", "+ Add Person".

RECENT TRANSACTIONS section: header "Recent Transactions" + "View all"
link, followed by 2–3 compact rows (icon, title/category, amount in red)
— visually consistent with the desktop version, slightly condensed.

BOTTOM NAVIGATION BAR (fixed): 5 icons — Dashboard (active, red), 
Transactions, People, Insights, Settings — icon + tiny label each.
```

---

## 3. Transactions Page

```
Design the TRANSACTIONS page for Pace (design as both a desktop panel and a
mobile screen), same design system.

HEADER: Page title "Transactions", a search bar with magnifying-glass icon
and placeholder "Search transactions".

FILTER ROW: horizontal pill/segmented filter control with options
"All" (active, solid red pill), "Expenses", "Income", "Bills" (inactive,
light gray pills).

DATE GROUPING: content is grouped under bold small-caps date labels —
"Today", "Yesterday" — each followed by a vertical list of compact
transaction rows.

TRANSACTION ROW pattern (repeat with sample data):
- Small colored circular icon on the left matching category (fork/knife
  for Food, credit-card icon for Bills, bus icon for Transport, shopping
  bag for Shopping)
- Title (e.g. "Dinner") with small gray subtitle category (e.g. "Food")
  stacked underneath
- Timestamp small and gray, right-aligned above the amount OR inline
- Amount right-aligned, bold, red for expenses ("−₹150", "−₹1,000",
  "−₹40", "−₹320") 

Sample rows for "Today": Dinner/Food −₹150 8:15 PM, Credit Card Bill/Bills
−₹1,000 12:30 PM, Bus/Transport −₹40 9:10 AM.
Sample row for "Yesterday": Grocery/Shopping −₹320.

Keep rows dense (compact height ~56–64px) so many can be seen at once,
divided by thin 1px light gray separators, all inside one long white
rounded card/list container.
```

---

## 4. People Page

```
Design the PEOPLE page for Pace, same design system.

TOP SUMMARY: two side-by-side pill/stat chips at the top —
"To Receive" (green label, value "₹850", caption "3 people") and
"To Give" (red label, value "₹300", caption "2 people") — displayed as
two compact rounded cards side by side, or one card split by a divider.

PEOPLE LIST: vertical list of rounded rows, each with:
- Circular avatar photo/initial on the left
- Person name, bold
- Small gray caption underneath: "Owes you" (if positive) or "You owe"
  (if negative)
- Right-aligned bold amount: green "+₹500" if they owe the user, red
  "−₹300" if the user owes them

Sample rows: "Rahul — Owes you — +₹500", "Aman — You owe — −₹300",
"Karan — Owes you — +₹350".

BOTTOM: full-width or floating "+ Add Transaction" button in solid red,
pinned to the bottom of the list/screen.
```

---

## 5. Person Details Page

```
Design the PERSON DETAILS page for Pace (a sub-page reached by tapping a
person in the People list), same design system.

HEADER: back arrow "←" top-left. Below it, a centered/left profile block:
circular avatar, person name "Rahul" bold large, status caption "Owes
you" in green, and a large bold amount "₹500" beneath the name.

ACTION BUTTONS row (two buttons side by side):
- If they owe the user: solid green "Receive Money" button (primary)
  and a lighter/outline "+ Add Transaction" button (secondary)
- (Design should imply the primary button swaps to solid red "Give
  Money" when the balance is reversed — include a small note/label in
  the design describing this adaptive state)

HISTORY section: label "History", followed by a vertical timeline/list:
- Row: date "30 Aug", description "Gave Rahul ₹500 — Dinner", right-
  aligned green "+₹500 owed"
- Row: date "31 Aug", description "Received ₹200 — Partial repayment",
  right-aligned red "−₹200"
- Divider then a bold summary row: "Remaining" label with value "₹300"

Use small colored dots or icons on the timeline to visually separate
"gave" vs "received" entries (green dot for money given/owed increasing,
gray/red dot for repayment).
```

---

## 6. Add Transaction (With Person) — Modal

```
Design the ADD TRANSACTION (WITH PERSON) modal/bottom-sheet for Pace, same
design system.

HEADER: back arrow "←" and title "Add Transaction (With Person)", close
"×" not needed if back arrow present.

PERSON SELECT: a rounded selector row showing avatar + "Rahul" with a
small chevron to change person.

QUESTION LABEL: "What happened?" in medium-weight gray text, followed by
two large toggle/segmented buttons side by side:
- "↖ I gave money" (selected state: light green fill, green border, green
  check or icon)
- "↗ I took money" (unselected state: light gray outline)

FORM FIELDS (stacked, rounded input boxes with small gray labels above
each): "Amount" (with ₹ prefix, showing "500"), "Reason" (text field,
showing "Dinner"), "Date" (date field with calendar icon, showing
"31 Aug 2026").

BOTTOM: full-width solid green "Save Transaction" button.
```

---

## 7. Insights Page

```
Design the INSIGHTS page for Pace, same design system.

HEADER: Page title "Insights" with a "This Month" dropdown/pill selector
top-right.

SPENDING OVERVIEW card: label "Spending Overview", large bold value
"₹3,200" with caption "Total spent this month", small green caption
"↓ 12% vs last month". Beside/below the number, a colorful donut/ring
chart broken into category segments with a small legend: Food 28%,
Bills 22%, Transport 18%, Shopping 15%, Other 17% (use distinct soft
colors per segment — red, orange, green, blue, gray).

DAILY SPENDING card: label "Daily Spending", a bar chart showing 7 days
(dates 25–31) with bars in mixed colors (mostly gray/neutral, with 1–2
bars in orange or red to highlight higher-spend days), amount scale on
the left (₹0–₹600 range).

Optionally include a "Top Spending" small list card below showing top
2–3 categories with icon, name, and amount, right-aligned.
```

---

## 8. Add Expense — Modal

```
Design the ADD EXPENSE modal for Pace, same design system. This is the
single most frequently used screen, so it must feel fast and effortless.

HEADER: title "Add Expense (Modal)" with a close "×" icon top-right.

AMOUNT: the largest input on the entire screen — big bold "₹" prefix and
numeric value "150", centered or left-aligned, minimal border, clearly
the primary focus.

FORM FIELDS below (stacked, rounded boxes with small gray labels above
each):
- "Category" — a selector row showing a small food icon + "Food" with a
  chevron to open a category picker
- "Reason / Description" — text input, placeholder or filled with
  "Dinner"
- "Date" — field with calendar icon, showing "31 Aug 2026"
- "Payment Method" — optional field, small icon + "UPI"

BOTTOM: full-width solid red "Add Expense" button.

Keep vertical spacing generous but the whole modal compact enough to fit
without scrolling on mobile — this form should look like it can be
completed in under 10 seconds.
```

---

## How to use these in Stitch

1. Paste the **Global Design System** block first (or save it as your
   Stitch project's style/brand guide if it supports one).
2. Generate screens one at a time using each numbered block — this keeps
   Stitch's output consistent page to page.
3. If Stitch supports reference images, attach the provided screenshot
   alongside each prompt for closer visual matching.
4. After first-pass generation, iterate with follow-ups like "make the
   Money Left card gradient darker toward the bottom-right" or "increase
   spacing between transaction rows" to refine.
