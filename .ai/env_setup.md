# Environment Setup

## Environment Variables
The application uses Vite's environment variable handling (`.env` files).

### Required Variables
None are strictly required for the core application to run in offline mode.

### Optional Variables
-   `GEMINI_API_KEY`: Required for the "Bulk Add" AI feature.
    -   Loaded via `process.env.API_KEY` or `process.env.GEMINI_API_KEY` in `vite.config.ts`.
    -   Should be set in `.env` (local) or your deployment platform variables.

## Local Setup
1.  Clone repo.
2.  `npm install`
3.  Create `.env` if using AI features:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
4.  `npm run dev`
