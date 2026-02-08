# Workflows

## Development
-   **Start Dev Server**: `npm run dev` (Runs Vite)
    -   Access at `http://localhost:3000`
-   **Type Check**: No dedicated script in `package.json`, but `tsc --noEmit` is standard.

## Build
-   **Build for Production**: `npm run build`
    -   Output directory: `dist/`
-   **Preview Build**: `npm run preview`

## Docker
The application can be containerized using the provided `Dockerfile`.
-   **Build Image**: `docker build -t i8e10 .`
-   **Run Container**: `docker run -p 3000:80 i8e10`
-   **Compose**: `docker-compose up -d` (Runs with Nginx configuration)

## Data Migration
-   **LocalStorage to IndexedDB**: Handled automatically in `App.tsx` (`handleLSToIDBMigration`) for legacy users.
-   **Key Rotation/Recovery**: Handled in `src/utils/cryptoService.ts` via recovery phrase.
