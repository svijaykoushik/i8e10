# System Profile: i8e10

## Project Overview
i8e10 is a secure, private, offline-first personal finance tracker built as a Progressive Web App (PWA). Ideally suited for users who value privacy, it performs all data storage and cryptographic operations locally in the browser using IndexedDB and the Web Crypto API.

## Core Principles
1.  **Privacy First**: No server-side storage of user data. All data stays on the device.
2.  **Offline First**: Fully functional without an internet connection.
3.  **Client-Side Encryption**: Data is encrypted using AES-GCM derived from a user password before being stored in IndexedDB.
4.  **No Backend**: The application is a static site; there is no API server for data persistence.

## Tech Stack
-   **Frontend**: React 19, TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS (v4)
-   **State Management**: React Context (Theme, etc.) + Local State
-   **Database**: Custom IndexedDB Wrapper (Dexie-like API)
-   **Cryptography**: Web Crypto API (native)
-   **PWA**: vite-plugin-pwa (with manifest shortcuts for key actions)
-   **Routing**: react-router-dom with Framer Motion route transitions
-   **Animations**: Framer Motion for layout transitions and route animations

## Key Directories
-   `components/`: React components (UI, modals, filters, layout)
-   `pages/`: Route-based page components (Transactions, Debts, Investments, Health)
-   `hooks/`: Custom React hooks (useTransactions, useDebts, useInvestments, useSettings, useTheme, etc.)
-   `contexts/`: React Context definitions (ThemeContext)
-   `src/db/`: Database schema and configuration
-   `src/components/auth/`: Authentication components
-   `utils/`: Core utilities (db wrapper, accounting adapter, crypto service, importers/exporters, transaction presenter)
-   `types.ts`: Core type definitions
