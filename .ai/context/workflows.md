# Workflows

## Development
-   **Start Dev Server**: `npm run dev` (Runs Vite at `http://localhost:3000`)
-   **Type Check**: Standard `tsc --noEmit` applies.

## Testing
-   **Unit Tests**: `npm run test` (Runs Vitest once).
-   **Unit Tests (Watch)**: `npm run test:watch` (Runs Vitest in watch mode).
-   **E2E Tests**: `npm run test:e2e` (Runs Playwright tests).

## Build
-   **Build for Production**: `npm run build` (Output in `dist/`)
-   **Preview Build**: `npm run preview`

## Docker
The application can be containerized using the provided `Dockerfile`.
-   **Build Image**: `docker build -t i8e10 .`
-   **Run Container**: `docker run -p 3000:80 i8e10`

## Data Migration
-   **LocalStorage to IndexedDB**: Handled automatically in `App.tsx` (`handleLSToIDBMigration`) for legacy users.
-   **Key Rotation/Recovery**: Handled in `src/utils/cryptoService.ts` via recovery phrase.
