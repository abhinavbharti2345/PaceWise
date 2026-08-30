# Graph Report - PaceWise  (2026-08-31)

## Corpus Check
- 112 files · ~111,547 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 165 nodes · 273 edges · 12 communities (9 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- UI Components & Modals
- TypeScript App Config
- Build & Dev Tooling
- Node & Vite Config
- Budget Domain Logic & PRD
- Core Dependencies & Utilities
- App Routing & Layout
- Package Metadata
- UI/UX Design Architecture
- TypeScript Workspace Config
- Stitch Design System Tokens

## God Nodes (most connected - your core abstractions)
1. `useStore` - 21 edges
2. `compilerOptions` - 18 edges
3. `cn()` - 16 edges
4. `compilerOptions` - 15 edges
5. `Button()` - 8 edges
6. `Card()` - 6 edges
7. `calculateBudget()` - 6 edges
8. `scripts` - 5 edges
9. `Input` - 5 edges
10. `IconBadge()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Badge()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/Badge.tsx → src/utils/cn.ts
- `AddExpenseModal()` --calls--> `useStore`  [EXTRACTED]
  src/components/modals/AddExpenseModal.tsx → src/store/useStore.ts
- `AddMoneyModal()` --calls--> `useStore`  [EXTRACTED]
  src/components/modals/AddMoneyModal.tsx → src/store/useStore.ts
- `AddPersonModal()` --calls--> `useStore`  [EXTRACTED]
  src/components/modals/AddPersonModal.tsx → src/store/useStore.ts
- `Dashboard()` --calls--> `calculateBudget()`  [EXTRACTED]
  src/pages/Dashboard.tsx → src/features/budget/budgetEngine.ts

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "UI Components & Modals"
Cohesion: 0.17
Nodes (19): AddExpenseModal(), AddExpenseModalProps, AddMoneyModal(), AddMoneyModalProps, AddPersonModal(), AddPersonModalProps, Badge(), BadgeProps (+11 more)

### Community 1 - "TypeScript App Config"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 2 - "Build & Dev Tooling"
Cohesion: 0.10
Nodes (21): oxlint, devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom (+13 more)

### Community 3 - "Node & Vite Config"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 4 - "Budget Domain Logic & PRD"
Cohesion: 0.16
Nodes (16): Carry-Forward System, Base Daily Budget Calculation, Dynamic Recalculation on Bills, People & Settlements, Student Money Tracker PRD, BudgetConfig, BudgetStats, calculateBudget() (+8 more)

### Community 5 - "Core Dependencies & Utilities"
Cohesion: 0.12
Nodes (17): clsx, date-fns, lucide-react, dependencies, clsx, date-fns, lucide-react, react (+9 more)

### Community 6 - "App Routing & Layout"
Cohesion: 0.32
Nodes (9): App(), AppLayout(), navItems, Dashboard(), Insights(), People(), Settings(), Transactions() (+1 more)

### Community 7 - "Package Metadata"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 8 - "UI/UX Design Architecture"
Cohesion: 0.67
Nodes (3): Dashboard Visual Hierarchy, Semantic Money States, UI/UX Design Specification

## Knowledge Gaps
- **82 isolated node(s):** `AddExpenseModalProps`, `AddMoneyModalProps`, `AddPersonModalProps`, `BadgeProps`, `ButtonProps` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 83 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Build & Dev Tooling` to `Package Metadata`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Core Dependencies & Utilities` to `Package Metadata`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `useStore` connect `App Routing & Layout` to `UI Components & Modals`, `Budget Domain Logic & PRD`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `AddExpenseModalProps`, `AddMoneyModalProps`, `AddPersonModalProps` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript App Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Build & Dev Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Node & Vite Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._