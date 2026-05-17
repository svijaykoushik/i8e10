---
title: "UI Architecture | பயனர் இடைமுக கட்டமைப்பு"
type: "module"
status: "active"
source_paths: ["App.tsx", "pages/", "components/Layout.tsx", "types.ts"]
updated_at: "2026-06-01"
---

# UI Architecture | பயனர் இடைமுக கட்டமைப்பு

The user interface of i8e10 is built as a single-page application (SPA) using React Router for route-based navigation with Framer Motion animations.

## Routing System | ரூட்டிங் அமைப்பு
The app uses **react-router-dom** for client-side routing with animated page transitions:
- **Transactions Page** (`/transactions`): Daily ledger and transaction management
- **Debts Page** (`/debts`): Lending and borrowing management
- **Investments Page** (`/investments`): Asset tracking
- **Health Page** (`/health`): Financial summary and analytics

## Component Hierarchy | கூறு வரிசைமுறை
- **App.tsx**: Entry point with React Router configuration and global handlers
- **Layout.tsx**: Header, tab navigation, and `AnimatePresence` wrapper for route transitions
- **Page Components** (`pages/`): Route-specific views managing their own state and data
- **Modals**: Ephemeral UI for data entry (Add, Edit, Reconcile), rendered by page components
- **Skeleton Loaders**: View-specific loading states via `SkeletonLoader.tsx`
- **Hooks**: Custom hooks (e.g., `useTransactions`, `useScrollDirection`, `liveQuery`) encapsulate business logic and reactive data

## Data Loading & Animation | தரவு ஏற்றுதல் மற்றும் அசைவு
- **Skeleton Loaders**: Each page shows a skeleton while data loads from IndexedDB
- **Route Transitions**: Framer Motion `motion.div` with `layoutId` smoothly animates page entry/exit
- **Optimized Fetching**: Filtered hooks (`useFilteredTransactions`, etc.) reduce in-memory filtering overhead
- **Performance**: Display data is kept separate from totals calculations for responsiveness

## Theming | தீமிங்
The app uses Tailwind CSS with semantic coloring and accessibility focus:
- **Color System**: Green for income, Red for expenses, Blue for transfers
- **Interactive Feel**: Buttons and cards use subtle shadows and scaling transitions
- **Dark Mode**: Full dark mode support via `ThemeContext` and Tailwind dark: variants

## Interlinks | இணைப்புகள்
- [Interaction Model](../features/interaction-model.md) - How users interact with the UI
- [Header Navigation](../features/header-navigation.md) - Tab-based navigation and filtering
- [Financial Health](../features/financial-health.md) - Dashboard and analytics view
