# Coding Conventions

## Code Style
-   **Formatting**: Prettier (implied by typical React setups).
-   **Naming**: PascalCase for Components, camelCase for functions/variables.
-   **Imports**: Absolute imports using `@/` alias (configured in `vite.config.ts` and `tsconfig.json`).

## React Patterns
-   **Components**: Functional components with Hooks.
-   **Props**: Typed interfaces/types for all props.
-   **Side Effects**: Managed via `useEffect`.
-   **Data Binding**: Use `liveQuery` hooks (custom implementation) to subscribe to database changes.

## Database (Custom Wrapper)
-   **Access**: Use the singleton `db` instance from `utils/db.ts`.
-   **API**: Mimics Dexie.js with chainable methods (`orderBy`, `reverse`, `filter`).
-   **Transactions**: Use `db.transaction('rw', [tables], async () => { ... })` for atomic multi-table updates.

## Styling (Tailwind)
-   **Version**: Tailwind CSS v4.
-   **Usage**: Utility classes directly in `className`.
-   **Dark Mode**: Supported via `dark:` variant and `ThemeContext`.

## Error Handling
-   **UI**: Simple `alert` or custom modals (e.g., `AlertModal`).
-   **Async**: `try/catch` blocks around `await` calls, especially for DB and Crypto operations.
