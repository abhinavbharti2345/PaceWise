# Graph Report - PaceWise  (2026-08-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 142 nodes · 345 edges · 12 communities (8 shown, 3 thin omitted)
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
1. `cn()` - 35 edges
2. `useStore` - 29 edges
3. `compilerOptions` - 18 edges
4. `compilerOptions` - 15 edges
5. `Button()` - 13 edges
6. `calculateBudget()` - 9 edges
7. `getCategoryMeta()` - 7 edges
8. `Card()` - 7 edges
9. `Input` - 7 edges
10. `Dashboard()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Badge()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/Badge.tsx → src/utils/cn.ts
- `PersonTransactionModalProps` --references--> `Person`  [EXTRACTED]
  src/components/modals/PersonTransactionModal.tsx → src/store/useStore.ts
- `SettleModalProps` --references--> `Person`  [EXTRACTED]
  src/components/modals/SettleModal.tsx → src/store/useStore.ts
- `AddPersonModal()` --calls--> `cn()`  [EXTRACTED]
  src/components/modals/AddPersonModal.tsx → src/utils/cn.ts
- `PersonTransactionModal()` --calls--> `cn()`  [EXTRACTED]
  src/components/modals/PersonTransactionModal.tsx → src/utils/cn.ts

## Import Cycles
- None detected.

## Communities (12 total, 3 thin omitted)

### Community 0 - "UI Components & Modals"
Cohesion: 0.22
Nodes (20): App(), AppLayout(), navItems, AddBillModal(), AddExpenseModal(), AddMoneyModal(), IconBadge(), IconBadgeProps (+12 more)

### Community 1 - "TypeScript App Config"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 2 - "Build & Dev Tooling"
Cohesion: 0.13
Nodes (18): Carry-Forward System, Base Daily Budget Calculation, Dynamic Recalculation on Bills, People & Settlements, Student Money Tracker PRD, BudgetConfig, BudgetStats, Transaction (+10 more)

### Community 3 - "Node & Vite Config"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 4 - "Budget Domain Logic & PRD"
Cohesion: 0.28
Nodes (9): AddPersonModal(), AddPersonModalProps, PersonTransactionModal(), PersonTransactionModalProps, SettleModal(), SettleModalProps, Button(), ButtonProps (+1 more)

### Community 5 - "Core Dependencies & Utilities"
Cohesion: 0.23
Nodes (9): AddBillModalProps, AddExpenseModalProps, AddMoneyModalProps, Input, InputProps, BILL_CATEGORIES, CategoryMeta, EXPENSE_CATEGORIES (+1 more)

### Community 6 - "App Routing & Layout"
Cohesion: 0.57
Nodes (4): Card(), CardHeader(), CardProps, CardTitle()

### Community 7 - "Package Metadata"
Cohesion: 0.67
Nodes (3): Dashboard Visual Hierarchy, Semantic Money States, UI/UX Design Specification

## Knowledge Gaps
- **62 isolated node(s):** `IconBadgeProps`, `FilterType`, `TimeFilter`, `BudgetStats`, `AddPersonModalProps` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 64 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Components & Modals` to `UI/UX Design Architecture`, `Budget Domain Logic & PRD`, `Core Dependencies & Utilities`, `App Routing & Layout`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `useStore` connect `UI Components & Modals` to `Build & Dev Tooling`, `Budget Domain Logic & PRD`, `Core Dependencies & Utilities`, `App Routing & Layout`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `IconBadgeProps`, `FilterType`, `TimeFilter` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript App Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Build & Dev Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `Node & Vite Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._