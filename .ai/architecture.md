# Architecture Guide

## High-Level Architecture
i8e10 is a client-side only application. The "backend" effectively runs inside the browser using IndexedDB.

### Data Flow
1.  User Input -> React Component
2.  Component -> `liveQuery` (Custom implementation) / `db` operations
3.  `db` Middleware -> Encryption/Decryption (using `cryptoService`)
4.  IndexedDB -> Persistent Storage

## Database (Custom Wrapper)
The application uses a custom `CustomDatabase` class that wraps native IndexedDB, exposing an API similar to Dexie.js.
-   **Location**: `src/db/database.ts`
-   **Database Name**: `i8e10DB`
-   **Schema**: Dynamic schema creation based on `upgradeneeded` event in `src/db/database.ts`.
-   **Tables**:
    -   `transactionItems`: Income, Expenses, Transfers.
    -   `debts`: Lending/Borrowing records.
    -   `investments`: Asset tracking.
    -   `investmentTransactions`: History of investment activities.
    -   `debtInstallments`: Repayment records for debts.
    -   `settings`: Key-value store for app configuration and encryption keys (salt, verifier, wrapped keys).

### Encryption Layer
A custom middleware in `src/db/database.ts` intercepts `add`, `put`, and `get` operations.
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
