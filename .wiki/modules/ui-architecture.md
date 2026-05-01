---
title: "UI Architecture | பயனர் இடைமுக கட்டமைப்பு"
type: "module"
status: "active"
source_paths: ["App.tsx", "types.ts"]
updated_at: "2026-05-01"
---

# UI Architecture | பயனர் இடைமுக கட்டமைப்பு

The user interface of i8e10 is built as a single-page application (SPA) with a custom view-management system.

## View Management | காட்சி மேலாண்மை
Instead of using a routing library, the app uses a top-level `activeView` state to toggle between primary modules.
- **Transactions**: Daily ledger view.
- **Debts**: Lending and borrowing management.
- **Investments**: Asset tracking.
- **Health**: Financial summary and analytics.

## Component Hierarchy | கூறு வரிசைமுறை
- **App.tsx**: The entry point managing global state, database connections, and view routing.
- **Modals**: Ephemeral UI for data entry (Add, Edit, Reconcile).
- **Hooks**: Custom hooks (e.g., `useScrollDirection`, `liveQuery`) encapsulate business logic and side effects.

## Theming | தீமிங்
The app uses Tailwind CSS with a primary focus on accessibility and dark mode support.
- **Color System**: Uses semantic coloring (Green for income, Red for expenses).
- **Tactile feel**: Buttons and cards use subtle shadows and scaling transitions to feel interactive.

## Interlinks | இணைப்புகள்
- [Interaction Model](../features/interaction-model.md) - How users interact with the UI.
- [Header Navigation](../features/header-navigation.md) - How users navigate between views.
