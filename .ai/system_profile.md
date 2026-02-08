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
-   **PWA**: vite-plugin-pwa
-   **Routing**: None (Single Page Application with conditional rendering based on `activeView`)

## Key Directories
-   `src/components`: React components (UI and feature-specific)
-   `src/contexts`: React Context definitions
-   `src/db`: Database schema, configuration, and middleware (encryption)
-   `src/utils`: Utility functions (crypto, CSV import/export, formatting)
-   `src/types.ts`: Core type definitions
