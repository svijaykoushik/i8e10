# Build Optimization & Chunking Strategy

This document outlines the decisions made to optimize the i8e10 production build and establishes rules for future manual chunking as the codebase grows.

## Context
As the application grew, the default Vite/Rollup bundling strategy resulted in a single `index.js` chunk exceeding 600kB. This triggered build warnings and increased initial load time. Additionally, mixed static and dynamic imports of core utilities prevented efficient code splitting.

## Decisions Made (May 2026)

### 1. Manual Chunking Configuration
We implemented a custom `manualChunks` function in `vite.config.ts` to split the bundle into cacheable segments:

- **`vendor-core`**: Includes `react`, `react-dom`, and `framer-motion`. These are large, stable libraries that change infrequently.
- **`vendor`**: A catch-all for other smaller third-party dependencies.
- **`index`**: Contains only the application logic and small utilities.

### 2. Preserving Dynamic Imports
A critical decision was made to **exclude** heavy, non-essential libraries from the manual vendor chunks.
- **Libraries**: `jspdf`, `html2canvas`, `dompurify`.
- **Reason**: These are dynamically imported in `utils/pdfGenerator.ts`. If they were forced into a `vendor` chunk, they would be loaded on the initial page load, negating the benefits of dynamic imports.
- **Rule**: If a library is > 50kB and used only in specific features (like Reports), it MUST be dynamically imported and MUST NOT be part of a manual static chunk.

### 3. Resolving Import Conflicts
We standardized on **static imports** for core data management files (like `src/db/accounts.ts`) that were being imported both statically (for types/helpers) and dynamically (for logic). 
- **Rule**: If a file is small (< 10kB) and already partially imported statically, make it fully static to avoid Rollup chunking warnings.

## Rules for Future Manual Chunking

When the build generates new warnings or the application feels slow to load, follow these rules:

### Rule 1: Monitor Chunk Sizes
- The main `index.js` chunk should ideally stay below **300kB** (minified).
- If `index.js` exceeds this, identify large components (e.g., complex Modals or Charts) and use `React.lazy` to split them.

### Rule 2: Dynamic Import Priority
- Any dependency > 50kB that is not required for the initial "Transactions" or "Health" view should be dynamically imported.
- Example: `chart.js`, `xlsx`, or complex animation libraries.

### Rule 3: Manual Chunking Hygiene
- When adding a library to `manualChunks` in `vite.config.ts`, verify it doesn't break existing dynamic splits.
- Always check the build output log: if a file that was previously its own chunk (e.g., `jspdf.js`) disappears and the `vendor.js` size increases by the same amount, the chunking rule is too aggressive.

### Rule 4: Thresholds
- **`chunkSizeWarningLimit`**: Keep this set to **600kB**. If a chunk exceeds this after splitting, it indicates a need for architectural changes (like moving logic to Workers or more aggressive lazy loading).

## Build Verification
After any change to chunking strategy, run:
```bash
npm run build
```
Verify that:
1. No "mixed import" warnings appear.
2. `index.js` size remains stable.
3. Feature-specific chunks (like `jspdf`) are still generated.
