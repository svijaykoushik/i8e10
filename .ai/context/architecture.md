# Architecture Guide

## High-Level Architecture
i8e10 is a client-side only application. The "backend" effectively runs inside the browser using IndexedDB.

### Data Flow
1.  User Input -> React Component
2.  Component -> `liveQuery` (Custom implementation) / `db` operations
3.  `db` Middleware -> Encryption/Decryption (using `cryptoService`)
4.  IndexedDB -> Persistent Storage

## Database (Custom Wrapper & Double-Entry Ledger)
The application uses a custom IndexedDB wrapper (`TableProxy`) over a core database, exposing a Dexie-like API.
-   **Location**: `utils/db.ts` (Wrapper), `src/db/index.ts` (Core DB).
-   **Database Name**: `i8e10DB`
-   **Tables**:
    -   `transactions_v2`: Double-entry accounting ledger (replaces legacy `transactionItems`).
    -   `accounts`: System and wallet accounts for double-entry system.
    -   `transactionItems`: Legacy transactions (deprecated).
    -   `debts`: Lending/Borrowing records.
    -   `investments`: Asset tracking.
    -   `investmentTransactions`: History of investment activities.
    -   `debtInstallments`: Repayment records for debts.
    -   `settings`: Key-value store for app configuration and encryption keys.

### Encryption Layer
A custom middleware in `utils/db.ts` intercepts `add`, `put`, and `get` operations.
-   **Write**: Encrypts sensitive fields using the session key.
-   **Read**: Decrypts data before returning it to the application.
-   **Key Management**: The master key is wrapped (encrypted) with a key derived from the user's password (PBKDF2 + AES-GCM).

## State Management
-   **Global State**: React Context is used sparingly (e.g., `ThemeContext`).
-   **Data State**: The custom live-query implementation in `liveQuery.ts` is used to bind UI components directly to database queries. This ensures the UI updates automatically when data changes.
-   **Local State**: `useState` is used for form handling and UI toggles.

## Routing
The app uses **react-router-dom** for route-based page navigation with animated transitions.
-   **Layout Component**: `components/Layout.tsx` provides header, tab navigation, and `AnimatePresence` wrapper for route transitions using Framer Motion.
-   **Page Components**: Located in `pages/` directory:
    -   `TransactionsPage.tsx`: Transaction management view
    -   `DebtsPage.tsx`: Debt tracking view
    -   `InvestmentsPage.tsx`: Investment management view
    -   `HealthPage.tsx`: Financial health dashboard
-   **Route Configuration**: Defined in `App.tsx` using React Router `<Routes>` and `<Route>` elements
-   **Animations**: Framer Motion `motion.div` with `layoutId` props enable smooth page transitions
-   **Skeleton Loaders**: Custom `SkeletonLoader.tsx` component shows view-specific loading states during data fetch

## Reporting & Document Generation
The application supports client-side PDF generation for financial reports.
-   **Engine**: `jsPDF` with `jspdf-autotable`.
-   **Logic**: Encapsulated in `utils/pdfGenerator.ts`.
-   **Utilities**: `utils/numberToWords.ts` provides Indian numbering system word conversion for financial amounts.
-   **Implementation**: Reports are generated entirely in the browser using the current decrypted state of the database.
-   **Standards**: Follows Indian financial formatting (en-IN locale, Rs symbol, DD/MM/YYYY dates).

## Data Fetching & Optimization
-   **All-Data Hooks**: Core hooks (`useTransactions`, `useDebts`, `useInvestments`) maintain subscriptions to all data for totals and balance calculations.
-   **Filtered Hooks**: Optimized hooks (`useFilteredTransactions`, `useFilteredDebts`, `useFilteredInvestments`) support filter-aware DB queries:
    -   Accept `FilterState` parameter to enable selective data fetch
    -   Filter by date range, wallet, transaction type, status, etc. at the hook level
    -   Return filtered and presented UI data separate from totals calculations
-   **Presentation Layer**: `transactionPresenter.ts` converts double-entry ledger entries to user-friendly transaction objects for UI display
-   **Live Query Pattern**: All data subscriptions use `liveQuery` for reactive updates whenever IndexedDB data changes
-   **Performance**: Reduces in-memory filtering overhead by keeping display and totals calculation separate
