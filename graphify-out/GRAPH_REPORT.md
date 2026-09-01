# Graph Report - PaceWise  (2026-09-01)

## Corpus Check
- 164 files · ~134,879 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1913 nodes · 2153 edges · 115 communities (101 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e21c303a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- WCAG 2.2 Guidelines Reference
- TDD Cycle Orchestrator
- Student_Money_Tracker_UIUX.md
- ${PROJECT_NAME}
- Accessibility Audit
- JavaScript Testing Patterns
- PaceWise Supabase Integration Guide
- Student_Money_Tracker_PRD.md
- SwiftUI Component Library
- Breakpoint Strategies
- iOS Human Interface Guidelines Patterns
- Fluid Layouts and Typography
- Design Review
- Advanced Patterns
- code-explain.md
- Capabilities
- Component Specification
- Interactive Configuration
- React Navigation Patterns
- React Native Styling Patterns
- Visual Design Foundations
- compilerOptions
- PostgreSQL Table Design
- Design Tokens Deep Dive
- Jetpack Compose Component Library
- iOS Navigation Patterns
- Container Queries Deep Dive
- ARIA Patterns and Best Practices
- UI/UX Design Plugin for Claude Code
- Mobile Accessibility
- Android Navigation Patterns
- Typography Systems Reference
- Capabilities
- nodejs-backend-patterns — detailed patterns and worked examples
- Interaction Design
- PaceWise
- compilerOptions
- Capabilities
- Theming Architecture
- Icon Systems
- Capabilities
- Advanced Modern JavaScript Patterns
- Microinteraction Patterns Reference
- Scroll Animations Reference
- Material Design 3 Theming
- Color Systems Reference
- Capabilities
- Capabilities
- Capabilities
- modern-javascript-patterns — detailed patterns and worked examples
- Capabilities
- Core Capabilities
- Animation Libraries Reference
- Key Patterns
- dependencies
- devDependencies
- tutorial-engineer.md
- CSS Styling Approaches Reference
- Capabilities
- Capabilities
- React State Management
- Advanced v4 Patterns
- TypeScript Advanced Types
- Component Architecture Patterns
- Web Component Design
- Patterns
- Instructions
- Advanced Patterns
- Capabilities
- Pace — Money Tracker
- Instructions
- Node.js Advanced Patterns
- Design System Patterns
- Core Concepts
- Instructions
- Next.js App Router Patterns
- React Native Architecture
- Accessibility Patterns Reference
- Patterns
- Component Patterns Reference
- Tailwind Design System (v4)
- manifest.json
- Patterns
- Patterns
- Core Concepts
- Core Concepts
- docs-architect.md
- TDD Green Phase
- tdd-refactor.md
- Accessibility Compliance
- Key Patterns
- Android Mobile Design
- React Native Design
- package.json
- Node.js Backend Patterns
- TDD Red Phase
- Responsive Design
- scripts
- ErrorBoundary
- javascript-pro.md
- typescript-pro.md
- check_schema.ts
- tsconfig.json
- rules/graphify.md
- workflows/graphify.md
- copilot-instructions.md
- react
- @tailwindcss/vite
- @types/react-dom
- index.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `cn()` - 42 edges
2. `useStore` - 41 edges
3. `TDD Cycle Orchestrator` - 19 edges
4. `useAuthStore` - 18 edges
5. `compilerOptions` - 18 edges
6. `Button` - 17 edges
7. `compilerOptions` - 15 edges
8. `Capabilities` - 15 edges
9. `PostgreSQL Table Design` - 14 edges
10. `Capabilities` - 14 edges

## Surprising Connections (you probably didn't know these)
- `EditTransactionModalProps` --references--> `Transaction`  [EXTRACTED]
  src/components/modals/EditTransactionModal.tsx → src/features/budget/budgetEngine.ts
- `PersonTransactionModalProps` --references--> `Person`  [EXTRACTED]
  src/components/modals/PersonTransactionModal.tsx → src/store/useStore.ts
- `SettleModalProps` --references--> `Person`  [EXTRACTED]
  src/components/modals/SettleModal.tsx → src/store/useStore.ts
- `Badge()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/Badge.tsx → src/utils/cn.ts
- `AppContent()` --calls--> `useMonthRollover()`  [EXTRACTED]
  src/App.tsx → src/hooks/useMonthRollover.ts

## Import Cycles
- None detected.

## Communities (115 total, 11 thin omitted)

### Community 0 - "cn"
Cohesion: 0.06
Nodes (85): App(), AppContent(), ErrorBoundaryProps, ErrorBoundaryState, AppLayout(), navItems, AddBillModal(), AddBillModalProps (+77 more)

### Community 1 - "WCAG 2.2 Guidelines Reference"
Cohesion: 0.05
Nodes (41): 1.1.1 Non-text Content (Level A), 1.1 Text Alternatives, 1.2.1 Audio-only and Video-only (Level A), 1.2 Time-based Media, 1.3.1 Info and Relationships (Level A), 1.3.5 Identify Input Purpose (Level AA), 1.3 Adaptable, 1.4.11 Non-text Contrast (Level AA) (+33 more)

### Community 2 - "TDD Cycle Orchestrator"
Cohesion: 0.05
Nodes (39): 1. Check for existing session, 2. Initialize state, 3. Parse feature description, Anti-Patterns to Avoid, Completion, Configuration, Coverage Thresholds, CRITICAL BEHAVIORAL RULES (+31 more)

### Community 3 - "Student_Money_Tracker_UIUX.md"
Cohesion: 0.05
Nodes (37): 10\. Insights Page, 11\. Settings Page, 12.1 Design Language, 12.2 Components, 12.3 Semantic Money States, 12\. Global Visual Design, 13\. Responsive Design, 14\. User Flow (+29 more)

### Community 4 - "${PROJECT_NAME}"
Cohesion: 0.06
Nodes (35): 1. **API Documentation**, 2. **Architecture Documentation**, 3. **Code Documentation**, 4. **User Documentation**, 5. **Documentation Automation**, Automated Documentation Generation, Common Tasks, Configuration (+27 more)

### Community 5 - "Accessibility Audit"
Cohesion: 0.06
Nodes (33): 1. File Discovery, 2. Static Code Analysis, 3. Pattern Detection, 4. Color Contrast Analysis, 5. ARIA Validation, Accessibility Audit, Audit Execution, Automated Testing (+25 more)

### Community 6 - "JavaScript Testing Patterns"
Cohesion: 0.06
Nodes (31): Advanced JavaScript Testing Patterns, Common Patterns, Coverage Reports, Frontend Testing with Testing Library, Integration Testing, Pattern 1: API Integration Tests, Pattern 1: React Component Testing, Pattern 2: Database Integration Tests (+23 more)

### Community 7 - "PaceWise Supabase Integration Guide"
Cohesion: 0.06
Nodes (32): 1. Create a Supabase Project, 2. Set Up Database Schema, 3. Configure Environment Variables, 4. Deploy on Vercel, 5. Local Development, Adding New Data Types, After Authentication, API Functions (+24 more)

### Community 8 - "Student_Money_Tracker_PRD.md"
Cohesion: 0.06
Nodes (30): 10\. Development Scope, 11\. Product Design Direction, 12\. Core Product Principle, 13\. Open Questions / Next Decisions, 1\. Overview, 2\. Problem Statement, 3\. Goals, 4\. Non-Goals (V1) (+22 more)

### Community 9 - "SwiftUI Component Library"
Cohesion: 0.07
Nodes (27): Animations, Async Content Loading, AsyncImage, Basic List, Button Styles, Buttons and Actions, Confirmation Dialog, Custom Input Fields (+19 more)

### Community 10 - "Breakpoint Strategies"
Cohesion: 0.07
Nodes (27): Benefits, Bootstrap 5, Breakpoint Strategies, Breakpoint Tokens, Cards Grid, Combining Feature and Size Queries, Common Breakpoint Scales, Content-Based Breakpoints (+19 more)

### Community 11 - "iOS Human Interface Guidelines Patterns"
Cohesion: 0.07
Nodes (26): Accessibility, Adaptive Layouts, Color System, Custom Font with Dynamic Type, Dynamic Type Support, Empty States, Error Handling UI, Error States (+18 more)

### Community 12 - "Fluid Layouts and Typography"
Cohesion: 0.07
Nodes (26): Auto-fit Grid, Calculating Fluid Values, Cluster Layout, Combining Viewport and Container Units, Complete Type Scale, Container Widths, Content-Based Widths, CSS Grid Fluid Layouts (+18 more)

### Community 13 - "Design Review"
Cohesion: 0.08
Nodes (25): 1. Code Analysis, 2. Visual Design Review, 3. Usability Review, 4. Code Quality Review, 5. Performance Review, Design Review, If argument provided:, If no argument: (+17 more)

### Community 14 - "Advanced Patterns"
Cohesion: 0.08
Nodes (25): Advanced Patterns, Animation Callbacks, Bottom Sheet, Cancel Animations, Color Interpolation, Common Animation Patterns, Core Concepts, Derived Values (+17 more)

### Community 15 - "code-explain.md"
Cohesion: 0.07
Nodes (26): 1. Code Comprehension Analysis, 2. Visual Explanation Generation, 3. Step-by-Step Explanation, 4. Algorithm Visualization, 5. Interactive Examples, 6. Design Pattern Explanation, 7. Common Pitfalls and Best Practices, 8. Learning Path Recommendations (+18 more)

### Community 16 - "Capabilities"
Cohesion: 0.08
Nodes (24): Behavioral Traits, Caching Architecture, Capabilities, Cloud Database Architecture, Core Philosophy, Data Modeling & Schema Design, Disaster Recovery & High Availability, Example Interactions (+16 more)

### Community 17 - "Component Specification"
Cohesion: 0.08
Nodes (24): 1. Create Directory Structure, 2. Generate Component Code, 3. Generate Types, 4. Generate Styles, 5. Generate Tests (if testing framework detected), 6. Generate Barrel Export, Completion, Component Generation (+16 more)

### Community 18 - "Interactive Configuration"
Cohesion: 0.08
Nodes (24): 1. Generate Color Palette, 2. Generate Typography Scale, 3. Generate Spacing Scale, 4. Generate Additional Tokens, Core Design System File, CSS Custom Properties, Design System Setup, Documentation Generation (Comprehensive preset) (+16 more)

### Community 19 - "React Navigation Patterns"
Cohesion: 0.08
Nodes (24): Auth Flow, Basic Stack Navigator, Bottom Tab Navigator, Collapsible Header, Configuration, Custom Animations, Custom Header Component, Custom Tab Bar (+16 more)

### Community 20 - "React Native Styling Patterns"
Cohesion: 0.08
Nodes (24): Breakpoint System, Button Styles, Combining Styles, Container, Creating Styles, Cross-Platform Shadows, Customizable Button, FlatList with Styling (+16 more)

### Community 21 - "Visual Design Foundations"
Cohesion: 0.08
Nodes (23): 1. Typography Scale, 2. Spacing System, 3. Color System, Best Practices, Color Accessibility, Color Theory, Common Issues, Component Spacing (+15 more)

### Community 22 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 23 - "PostgreSQL Table Design"
Cohesion: 0.09
Nodes (22): Constraints, Core Rules, Data Types, Do not use the following data types, Examples, Extensions, Generated Columns, Indexing (+14 more)

### Community 24 - "Design Tokens Deep Dive"
Cohesion: 0.09
Nodes (22): Change Management, Color Tokens, CSS Custom Properties Output, Dark Theme, Deprecation Pattern, Design Tokens Deep Dive, Effects Tokens, Light Theme (+14 more)

### Community 25 - "Jetpack Compose Component Library"
Cohesion: 0.09
Nodes (22): Alert Dialog, Animated Content, Animated Visibility, Animations, Basic LazyColumn, Content Loading Pattern, Date and Time Pickers, Dialogs and Bottom Sheets (+14 more)

### Community 26 - "iOS Navigation Patterns"
Cohesion: 0.09
Nodes (22): Basic Navigation, Basic TabView (iOS 18+), Custom Navigation Transitions, Deep Linking, Hero Transitions, iOS Navigation Patterns, Modal Sheets, Navigation Coordinator Pattern (+14 more)

### Community 27 - "Container Queries Deep Dive"
Cohesion: 0.09
Nodes (22): Browser Support, Combining Conditions, Container Queries Deep Dive, Container Query Syntax, Container Query Units, Container Types, Containment Basics, Dashboard Widget (+14 more)

### Community 28 - "ARIA Patterns and Best Practices"
Cohesion: 0.09
Nodes (21): 1. Redundant ARIA, 2. Invalid ARIA, 3. Hidden Content Still Announced, Accordion, Alert Dialog, ARIA Fundamentals, ARIA Patterns and Best Practices, Assertive Announcements (+13 more)

### Community 29 - "UI/UX Design Plugin for Claude Code"
Cohesion: 0.10
Nodes (20): Accessibility, Accessibility Audit, Agents, Commands, Core Capabilities, Create Component, Design Review, Design System Setup (+12 more)

### Community 30 - "Mobile Accessibility"
Cohesion: 0.10
Nodes (20): Alternative Gestures, Android TalkBack, Android Text Scaling, Android XML Views, Dynamic Type / Text Scaling, Gesture Accessibility, iOS Dynamic Type, iOS VoiceOver (+12 more)

### Community 31 - "Android Navigation Patterns"
Cohesion: 0.10
Nodes (20): Android Navigation Patterns, Back Handler, Basic Deep Link Setup, Basic Navigation, Bottom Nav with Badges, Bottom Navigation, Deep Linking, Handling Intent in Activity (+12 more)

### Community 32 - "Typography Systems Reference"
Cohesion: 0.10
Nodes (20): Contrast Pairings, CSS Custom Properties, Fluid Type Scale, Font Loading Strategies, Font Pairing Guidelines, FOUT Prevention, Modular Scale, OpenType Features (+12 more)

### Community 33 - "Capabilities"
Cohesion: 0.10
Nodes (19): Advanced Mobile Features, App Store Optimization, Architecture & Design Patterns, Behavioral Traits, Capabilities, Cross-Platform Development, Data Management & Sync, DevOps & Deployment (+11 more)

### Community 34 - "nodejs-backend-patterns — detailed patterns and worked examples"
Cohesion: 0.10
Nodes (19): API Response Format, Architectural Patterns, Authentication & Authorization, Authentication Middleware, Caching Strategies, Core Frameworks, Custom Error Classes, Database Patterns (+11 more)

### Community 35 - "Interaction Design"
Cohesion: 0.10
Nodes (19): 1. Loading States, 1. Purposeful Motion, 2. State Transitions, 2. Timing Guidelines, 3. Easing Functions, 3. Page Transitions, 4. Feedback Patterns, 5. Gesture Interactions (+11 more)

### Community 36 - "PaceWise"
Cohesion: 0.10
Nodes (19): 1. Clone the repository, 2. Install dependencies, 3. Configure Environment Variables, 4. Run the development server, 5. Build for production, 🏗️ Architecture, 🔐 Authentication, 💰 Budget System (+11 more)

### Community 37 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 38 - "Capabilities"
Cohesion: 0.11
Nodes (18): AI-Assisted Test Generation & Evolution, Behavioral Traits, Capabilities, Cross-Team TDD Governance, Example Interactions, Expert Purpose, Framework & Technology Integration, Knowledge Base (+10 more)

### Community 39 - "Theming Architecture"
Cohesion: 0.11
Nodes (18): Accessibility Considerations, Base Setup, Brand Token Structure, Complete Implementation, CSS Custom Properties Architecture, Forced Colors, High Contrast Mode, Multi-Brand Theming (+10 more)

### Community 40 - "Icon Systems"
Cohesion: 0.11
Nodes (18): 8-Point Grid System, Aspect Ratios, Border Radius Scale, Container Queries for Spacing, Element Sizing Scale, Icon Button Patterns, Icon Libraries Integration, Icon Size Scale (+10 more)

### Community 41 - "Capabilities"
Cohesion: 0.11
Nodes (18): Advanced Testing Techniques, AI-Powered Testing Frameworks, Behavioral Traits, Capabilities, CI/CD Testing Integration, Cross-Platform Testing, Example Interactions, Knowledge Base (+10 more)

### Community 42 - "Advanced Modern JavaScript Patterns"
Cohesion: 0.11
Nodes (16): 1. Array Methods, 2. Higher-Order Functions, 3. Composition and Piping, 4. Pure Functions and Immutability, Advanced Modern JavaScript Patterns, Common Pitfalls, Functional Programming Patterns, Iterators and Generators (+8 more)

### Community 43 - "Microinteraction Patterns Reference"
Cohesion: 0.11
Nodes (17): Active Link Indicator, Button States, Character Count, Confirmation Dialog, Data Interactions, Feedback Patterns, Floating Label Input, Form Interactions (+9 more)

### Community 44 - "Scroll Animations Reference"
Cohesion: 0.11
Nodes (17): Clip Path Reveal, Framer Motion Parallax, Horizontal Scroll Section, Intersection Observer Hook, Parallax Scrolling, Performance Optimization, Progress-Based Animation, Reveal Animations (+9 more)

### Community 45 - "Material Design 3 Theming"
Cohesion: 0.11
Nodes (17): Color Roles Usage, Color System, Custom Color Scheme, Custom Fonts, Custom Shape Usage, Dynamic Color (Material You), Elevation and Shadows, Extended Colors (+9 more)

### Community 46 - "Color Systems Reference"
Cohesion: 0.11
Nodes (17): Accessible Color Pairs, Color Blindness Considerations, Color Harmony, Color Palette Generation, Color Systems Reference, Component Tokens, Contrast and Accessibility, CSS Color Functions (+9 more)

### Community 47 - "Capabilities"
Cohesion: 0.12
Nodes (16): AI-Powered Code Analysis, Behavioral Traits, Capabilities, Code Quality & Maintainability, Configuration & Infrastructure Review, Example Interactions, Expert Purpose, Integration & Automation (+8 more)

### Community 48 - "Capabilities"
Cohesion: 0.12
Nodes (16): Advanced Query Techniques and Optimization, Analytics and Business Intelligence, Behavioral Traits, Capabilities, Cloud Database Architecture, Data Modeling and Schema Design, Database Security and Compliance, DevOps and Database Management (+8 more)

### Community 49 - "Capabilities"
Cohesion: 0.12
Nodes (16): Accessibility & Inclusive Design, Behavioral Traits, Capabilities, Core React Expertise, Developer Experience & Tooling, Example Interactions, Knowledge Base, Modern Frontend Architecture (+8 more)

### Community 50 - "modern-javascript-patterns — detailed patterns and worked examples"
Cohesion: 0.12
Nodes (16): 1. Arrow Functions, 1. Promises, 2. Async/Await, 2. Destructuring, 3. Spread and Rest Operators, 4. Template Literals, 5. Enhanced Object Literals, Asynchronous Patterns (+8 more)

### Community 51 - "Capabilities"
Cohesion: 0.12
Nodes (16): AI-Powered Code Analysis, Behavioral Traits, Capabilities, Code Quality & Maintainability, Configuration & Infrastructure Review, Example Interactions, Expert Purpose, Integration & Automation (+8 more)

### Community 52 - "Core Capabilities"
Cohesion: 0.12
Nodes (16): 1. WCAG 2.2 Guidelines, 2. ARIA Patterns, 3. Keyboard Navigation, 4. Screen Reader Support, 5. Mobile Accessibility, accessibility-compliance — detailed patterns and worked examples, Color Contrast Requirements, Core Capabilities (+8 more)

### Community 53 - "Animation Libraries Reference"
Cohesion: 0.12
Nodes (16): Animation Libraries Reference, Basic Animations, Basic Timeline, CSS Spring Physics, Framer Motion, GPU Acceleration, GSAP (GreenSock), Layout Animations (+8 more)

### Community 54 - "Key Patterns"
Cohesion: 0.12
Nodes (16): 1. Container Queries, 2. Fluid Typography & Spacing, 3. Layout Patterns, 4. Breakpoint Strategy, Core Capabilities, Key Patterns, Modern Breakpoint Scale, Pattern 1: Container Queries (+8 more)

### Community 55 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, date-fns, lucide-react, dependencies, clsx, date-fns, lucide-react, react-dom (+9 more)

### Community 56 - "devDependencies"
Cohesion: 0.12
Nodes (17): oxlint, devDependencies, oxlint, tailwindcss, @types/node, @types/react, typescript, vite (+9 more)

### Community 57 - "tutorial-engineer.md"
Cohesion: 0.12
Nodes (15): Closing Section, Code Examples, Common Tutorial Formats, Content Elements, Core Expertise, Exercise Types, Explanations, Opening Section (+7 more)

### Community 58 - "CSS Styling Approaches Reference"
Cohesion: 0.12
Nodes (15): Class Variance Authority (CVA), Code Splitting Styles, Comparison Matrix, Composition, Critical CSS Extraction, CSS Modules, CSS Styling Approaches Reference, Custom Plugin (+7 more)

### Community 59 - "Capabilities"
Cohesion: 0.13
Nodes (14): Assistive Technology Compatibility, Automated & Manual Testing, Behavioral Traits, Capabilities, Cognitive Accessibility, Color & Visual Accessibility, Example Interactions, Keyboard Navigation & Focus Management (+6 more)

### Community 60 - "Capabilities"
Cohesion: 0.13
Nodes (14): Behavioral Traits, Capabilities, Component Library Architecture, Design-Development Workflow, Design Token Architecture, Documentation & Governance, Example Interactions, Knowledge Base (+6 more)

### Community 61 - "React State Management"
Cohesion: 0.14
Nodes (13): 1. State Categories, 2. Selection Criteria, Best Practices, Core Concepts, Detailed patterns and worked examples, Do's, Don'ts, From Legacy Redux to RTK (+5 more)

### Community 62 - "Advanced v4 Patterns"
Cohesion: 0.14
Nodes (13): Advanced v4 Patterns, Best Practices, Container Queries, Custom Utilities with `@utility`, Do's, Don'ts, Namespace Overrides, Pattern 5: Native CSS Animations (v4) (+5 more)

### Community 63 - "TypeScript Advanced Types"
Cohesion: 0.14
Nodes (13): 1. Generics, 2. Conditional Types, 3. Mapped Types, 4. Template Literal Types, 5. Utility Types, Best Practices, Common Pitfalls, Core Concepts (+5 more)

### Community 64 - "Component Architecture Patterns"
Cohesion: 0.14
Nodes (13): Best Practices, Children as Function, Component Architecture Patterns, Composition Patterns, Compound Components, Headless Components, Overview, Polymorphic Components (+5 more)

### Community 65 - "Web Component Design"
Cohesion: 0.14
Nodes (13): 1. Component Composition Patterns, 2. CSS-in-JS Approaches, 3. Component API Design, Best Practices, Common Issues, Core Concepts, Framework Patterns, Quick Start: React Component with Tailwind (+5 more)

### Community 66 - "Patterns"
Cohesion: 0.15
Nodes (12): Caching Strategies, Data Cache, nextjs-app-router-patterns — detailed patterns and worked examples, Pattern 1: Server Components with Data Fetching, Pattern 2: Client Components with 'use client', Pattern 3: Server Actions, Pattern 4: Parallel Routes, Pattern 5: Intercepting Routes (Modal Pattern) (+4 more)

### Community 67 - "Instructions"
Cohesion: 0.15
Nodes (12): 1. Analyze Project Type, 2. Initialize Project with pnpm, 3. Generate Next.js Project Structure, 4. Generate React + Vite Project Structure, 5. Generate Node.js API Project Structure, 6. Generate TypeScript Library Structure, 7. Configure Development Tools, Context (+4 more)

### Community 68 - "Advanced Patterns"
Cohesion: 0.15
Nodes (12): 1. Infer Keyword, 2. Type Guards, 3. Assertion Functions, Advanced Patterns, Pattern 1: Type-Safe Event Emitter, Pattern 2: Type-Safe API Client, Pattern 3: Builder Pattern with Type Safety, Pattern 4: Deep Readonly/Partial (+4 more)

### Community 69 - "Capabilities"
Cohesion: 0.15
Nodes (12): Behavioral Traits, Capabilities, Component Design & Creation, Design-to-Code Implementation, Example Interactions, Knowledge Base, Layout Systems & Grid Design, Prototyping & Interaction Design (+4 more)

### Community 70 - "Pace — Money Tracker"
Cohesion: 0.15
Nodes (12): 0. Global Design System (paste into every prompt), 1. Dashboard — Desktop, 2. Dashboard — Mobile, 3. Transactions Page, 4. People Page, 5. Person Details Page, 6. Add Transaction (With Person) — Modal, 7. Insights Page (+4 more)

### Community 71 - "Instructions"
Cohesion: 0.17
Nodes (11): 1. Analyze Component Requirements, 2. Generate React Component, 3. Generate React Native Component, 4. Generate Component Tests, 5. Generate Styles, 6. Generate Storybook Stories, Context, Instructions (+3 more)

### Community 72 - "Node.js Advanced Patterns"
Cohesion: 0.17
Nodes (11): API Response Format, Authentication & Authorization, Caching Strategies, Database Patterns, Dependency Injection, DI Container, JWT Authentication, MongoDB with Mongoose (+3 more)

### Community 73 - "Design System Patterns"
Cohesion: 0.17
Nodes (11): 1. Design Tokens, 2. Theming Infrastructure, 3. Component Architecture, 4. Token Pipeline, Best Practices, Common Issues, Core Capabilities, Design System Patterns (+3 more)

### Community 74 - "Core Concepts"
Cohesion: 0.17
Nodes (11): 1. Human Interface Guidelines Principles, 2. SwiftUI Layout System, 3. Navigation Patterns, 4. System Integration, 5. Visual Design, Best Practices, Common Issues, Core Concepts (+3 more)

### Community 75 - "Instructions"
Cohesion: 0.17
Nodes (11): 1. Analyze Code for Test Generation, 2. Generate Python Tests with pytest, 3. Generate JavaScript/TypeScript Tests with Jest, 4. Generate React Component Tests, 5. Coverage Analysis and Gap Detection, 6. Mock Generation, Automated Unit Test Generation, Context (+3 more)

### Community 76 - "Next.js App Router Patterns"
Cohesion: 0.18
Nodes (10): 1. Rendering Modes, 2. File Conventions, Best Practices, Core Concepts, Detailed patterns and worked examples, Do's, Don'ts, Next.js App Router Patterns (+2 more)

### Community 77 - "React Native Architecture"
Cohesion: 0.18
Nodes (10): 1. Project Structure, 2. Expo vs Bare React Native, Best Practices, Core Concepts, Detailed patterns and worked examples, Do's, Don'ts, Quick Start (+2 more)

### Community 78 - "Accessibility Patterns Reference"
Cohesion: 0.18
Nodes (10): Accessibility Patterns Reference, ARIA Patterns for Common Components, Color Contrast Utilities, Combobox / Autocomplete, Dropdown Menu, Focus Management Utilities, Form Validation, Live Regions (+2 more)

### Community 79 - "Patterns"
Cohesion: 0.20
Nodes (9): EAS Build & Submit, Pattern 1: Expo Router Navigation, Pattern 2: Authentication Flow, Pattern 3: Offline-First with React Query, Pattern 4: Native Module Integration, Pattern 5: Platform-Specific Code, Pattern 6: Performance Optimization, Patterns (+1 more)

### Community 80 - "Component Patterns Reference"
Cohesion: 0.20
Nodes (9): Component Patterns Reference, Compound Components Deep Dive, Controlled vs Uncontrolled Pattern, Forward Ref Pattern, Implementation with Context, Polymorphic Components, Render Props Pattern, Slot Pattern (+1 more)

### Community 81 - "Tailwind Design System (v4)"
Cohesion: 0.22
Nodes (8): 1. Design Token Hierarchy, 2. Component Architecture, Core Concepts, Detailed patterns and worked examples, Key v4 Changes, Quick Start, Tailwind Design System (v4), When to Use This Skill

### Community 82 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 83 - "Patterns"
Cohesion: 0.25
Nodes (7): Pattern 1: Redux Toolkit with TypeScript, Pattern 2: Zustand with Slices (Scalable), Pattern 3: Jotai for Atomic State, Pattern 4: React Query for Server State, Pattern 5: Combining Client + Server State, Patterns, react-state-management — detailed patterns and worked examples

### Community 84 - "Patterns"
Cohesion: 0.25
Nodes (7): Pattern 1: CVA (Class Variance Authority) Components, Pattern 2: Compound Components (React 19), Pattern 3: Form Components, Pattern 4: Responsive Grid System, Patterns, tailwind-design-system — detailed patterns and worked examples, Utility Functions

### Community 85 - "Core Concepts"
Cohesion: 0.25
Nodes (7): 1. Material Design 3 Principles, 2. Jetpack Compose Layout System, 3. Navigation Patterns, 4. Material 3 Theming, 5. Component Examples, Core Concepts, mobile-android-design — detailed sections

### Community 86 - "Core Concepts"
Cohesion: 0.25
Nodes (7): 1. StyleSheet and Styling, 2. Flexbox Layout, 3. React Navigation Setup, 4. Reanimated 3 Basics, 5. Platform-Specific Styling, Core Concepts, react-native-design — detailed sections

### Community 87 - "docs-architect.md"
Cohesion: 0.29
Nodes (6): Best Practices, Core Competencies, Documentation Process, Key Sections to Include, Output Characteristics, Output Format

### Community 88 - "TDD Green Phase"
Cohesion: 0.29
Nodes (6): CRITICAL BEHAVIORAL RULES, Implementation Process, Integration Points, Post-Implementation Checks, Recovery Process, TDD Green Phase

### Community 89 - "tdd-refactor.md"
Cohesion: 0.29
Nodes (6): Core Process, Example: Extract Method Pattern, Output Requirements, Recovery Protocol, Safety Checklist, Usage

### Community 90 - "Accessibility Compliance"
Cohesion: 0.29
Nodes (6): Accessibility Compliance, Best Practices, Common Issues, Detailed patterns and worked examples, Testing Tools, When to Use This Skill

### Community 91 - "Key Patterns"
Cohesion: 0.29
Nodes (6): design-system-patterns — detailed patterns and worked examples, Key Patterns, Pattern 1: Token Hierarchy, Pattern 2: Theme Switching with React, Pattern 3: Variant System with CVA, Pattern 4: Style Dictionary Configuration

### Community 92 - "Android Mobile Design"
Cohesion: 0.29
Nodes (6): Android Mobile Design, Best Practices, Common Issues, Detailed section: Core Concepts, Quick Start Component, When to Use This Skill

### Community 93 - "React Native Design"
Cohesion: 0.29
Nodes (6): Best Practices, Common Issues, Detailed section: Core Concepts, Quick Start Component, React Native Design, When to Use This Skill

### Community 94 - "package.json"
Cohesion: 0.29
Nodes (6): engines, node, name, private, type, version

### Community 95 - "Node.js Backend Patterns"
Cohesion: 0.33
Nodes (5): Best Practices, Detailed patterns and worked examples, Node.js Backend Patterns, Testing Patterns, When to Use This Skill

### Community 96 - "TDD Red Phase"
Cohesion: 0.33
Nodes (5): CRITICAL BEHAVIORAL RULES, Edge Case Categories, TDD Red Phase, Test Generation Process, Validation

### Community 97 - "Responsive Design"
Cohesion: 0.33
Nodes (5): Best Practices, Common Issues, Detailed patterns and worked examples, Responsive Design, When to Use This Skill

### Community 98 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 100 - "javascript-pro.md"
Cohesion: 0.50
Nodes (3): Approach, Focus Areas, Output

### Community 101 - "typescript-pro.md"
Cohesion: 0.50
Nodes (3): Approach, Focus Areas, Output

## Knowledge Gaps
- **1306 isolated node(s):** `name`, `private`, `version`, `node`, `type` (+1301 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1396 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `private`, `version` to the rest of the system?**
  _1306 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05688729874776386 - nodes in this community are weakly interconnected._
- **Should `WCAG 2.2 Guidelines Reference` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `TDD Cycle Orchestrator` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Student_Money_Tracker_UIUX.md` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `${PROJECT_NAME}` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Accessibility Audit` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._