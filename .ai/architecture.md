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
-   **Data State**: `liveQuery` from Dexie is used to bind UI components directly to database queries. This ensures the UI updates automatically when data changes.
-   **Local State**: `useState` is used for form handling and UI toggles.

## Routing
The app uses a custom "view" based routing system (state `activeView` in `App.tsx`) instead of a library like `react-router`.
-   **Views**: `transactions`, `debts`, `investments`, `health` (Financial Health).
