# Wiki Log | விக்கி பதிவு

This file records every "Ingest" session, detailing the files read and changes made to the wiki.

## [2026-06-01] - Route-Based Refactor, Performance Optimization & PWA Shortcuts | மைக்ரோ-வழிகாட்ட மறுமாதिरि, செயல்திறன் மேம்பாடு மற்றும் PWA குறுதுளிகள்

**Files Ingested:**
- `.worktrees/plan-refactor-views-to-pages/hooks/useTransactions.ts`, `useDebts.ts`, `useInvestments.ts`
- `pages/TransactionsPage.tsx`, `pages/DebtsPage.tsx`, `pages/InvestmentsPage.tsx`
- `components/Layout.tsx`, `components/SkeletonLoader.tsx`
- `vite.config.ts` (PWA manifest with shortcuts)
- `.ai/context/architecture.md`, `.ai/context/system_profile.md`

**Changes Made:**
- Updated [UI Architecture](modules/ui-architecture.md) to document react-router-dom routing, page-based components, and Framer Motion animations
- Updated `.ai/context/architecture.md` with new routing system, page components, and data fetching optimization strategy
- Updated `.ai/context/system_profile.md` to reflect current tech stack (react-router, Framer Motion) and directory structure
- Optimized `useFilteredTransactions` hook to support filter-aware DB queries while keeping totals separate
- Added PWA manifest shortcuts for "Add Transaction", "Manage Debts", and "Investments" with corresponding routes
- Verified build (✓), type-check (✓), and all 101 unit tests (✓)

**Performance Improvements:**
- Separated display data fetching from totals calculation to reduce in-memory filtering overhead
- Filter-aware hooks now enable selective data loads at database level
- Skeleton loaders provide smooth UX during route transitions and data loads

**Lessons Learned:**
- Route-based page architecture improves code organization and maintainability
- Framer Motion route animations enhance perceived performance even during data loads
- PWA shortcuts provide quick access to key user actions without requiring app redesign
- Separating filtered UI data from totals calculations is crucial for performance as dataset size grows

**Session Summary:**
Completed the route-based refactor continuation with performance optimization and PWA enhancements. All systems verified stable (build, tests, type-check). Documentation updated to reflect the new modular architecture with react-router navigation, optimized data fetching, and PWA shortcuts. Next priorities: investigate any remaining performance regressions and consider advanced caching strategies for very large datasets.

## [2026-05-01] - Initialization & Core Ingest | தொடக்கம் மற்றும் முதன்மை தரவு உள்ளீடு

**Files Ingested:**
- `.ai/index.md`, `.ai/system_profile.md`, `.ai/architecture.md`
- `src/db/database.ts`, `src/db/accounts.ts`, `src/db/doubleEntryTypes.ts`
- `utils/accountingAdapter.ts`, `utils/migrationV3.ts`

**Changes Made:**
- Initialized `.wiki/` directory structure.
- Created `.wiki/INDEX.md` with bilingual headings.
- Created [Core Database](modules/core-database.md) module page.
- Created [Accounting System](modules/accounting-system.md) module page.
- Created [Double-Entry Ledger](concepts/double-entry-ledger.md) concept page.
- Created [Forgiving Reconciliation](concepts/forgiving-reconciliation.md) concept page.

**Lessons Learned:**
- Double-entry validation is the bedrock of system stability.
- Deterministic IDs are essential for idempotent migrations.
- Equity-based reconciliation (Forgiving Reconciliation) balances user friction with accounting rigor.

## [2026-05-01] - Income Statement & Navigation Update | வருமான அறிக்கை மற்றும் வழிசெலுத்தல் புதுப்பிப்பு

**Files Ingested:**
- `utils/pdfGenerator.ts`, `components/ReportModal.tsx`, `utils/numberToWords.ts`
- `App.tsx`, `components/SettingsModal.tsx`
- `tests/reports.e2e.test.ts`

**Changes Made:**
- Updated [INDEX.md](INDEX.md) with required frontmatter and current `HEAD` SHA.
- Created [Income Statement](features/income-statement.md) feature page documenting the professional PDF generation pipeline.
- Created [Header Navigation](features/header-navigation.md) feature page documenting the new overflow menu and standardized time-period filters.
- Linked new features to existing [Double-Entry Ledger](concepts/double-entry-ledger.md) and [UI Architecture](modules/ui-architecture.md) pages.

**Lessons Learned:**
- Client-side PDF generation provides a private, offline-first way to handle financial documentation.
- Standardizing period-based filtering across views improves UX consistency.
- Indian numbering system (Words) is a critical requirement for local professional financial statements.

**Session Summary:**
Successfully ingested the new reporting system and UI navigation changes. The wiki now reflects the transition from simple list views to a more professional financial management tool with document generation capabilities.

## [2026-05-01] - Security & Core Features Ingest | பாதுகாப்பு மற்றும் முதன்மை அம்சங்கள் உள்ளீடு

**Files Ingested:**
- `utils/cryptoService.ts`, `utils/crypto.worker.ts`, `utils/db.ts`
- `utils/bulkAddParser.ts`, `components/BulkAddModal.tsx`
- `App.tsx`, `components/OnboardingGuide.tsx`

**Changes Made:**
- Created [Auth & Encryption](flows/auth-and-encryption.md) flow page documenting the zero-knowledge architecture and Master Key hierarchy.
- Created [Recovery Flow](flows/recovery-flow.md) page documenting the 12-word phrase mechanism and sequence.
- Created [Bulk Add](features/bulk-add.md) feature page documenting the multi-pass natural language parser.
- Created [Data Management](features/data-management.md) feature page documenting the secure data erasure process.
- Created [User Journey](flows/user-journey.md) flow page visualizing the lifecycle from onboarding to recovery.
- Updated [INDEX.md](INDEX.md) with the new knowledge categories (Features, Flows).

**Lessons Learned:**
- Web Workers are essential for maintaining 60fps while performing heavy crypto derivations like PBKDF2.
- Dual-wrapping the Master Key (Password + Recovery Phrase) provides a robust fallback without compromising zero-knowledge principles.
- Natural language parsing is most reliable when using a multi-pass approach that isolates deterministic tokens (Date, Amount) before inferring description.

## [2026-05-01] - Interaction, Portability & Specialized Modules | தொடர்பு, பெயர்வுத்திறன் மற்றும் சிறப்புத் தொகுதிகள்

**Files Ingested:**
- `components/BackupReminderBanner.tsx`, `utils/zipExporter.ts`, `utils/csvExporter.ts`
- `components/AddTransactionButton.tsx`, `hooks/useScrollDirection.ts`
- `utils/debtManager.ts`, `utils/investmentManager.ts`
- `utils/db.ts`, `src/db/database.ts`

**Changes Made:**
- Created [Backup System](features/backup-system.md) feature page documenting the reminder logic and Zip-based CSV bundling.
- Created [Interaction Model](features/interaction-model.md) feature page documenting the FAB's dual-action (tap/long-press) behavior and PWA offline capabilities.
- Created [Data Persistence](concepts/data-persistence.md) concept page documenting the IndexedDB middleware, schema evolution (V3), and portability.
- Created [Debt Management](modules/debt-management.md) and [Investment Tracking](modules/investment-tracking.md) module pages documenting their specific ledger integrations and lifecycles.
- Finalized [INDEX.md](INDEX.md) with complete coverage of concepts, features, flows, and modules.

**Lessons Learned:**
- Using standard formats like CSV within a Zip archive ensures long-term data sovereignty and spreadsheet compatibility.
- Long-press gestures on mobile can effectively double the functionality of a single primary button (FAB) without cluttering the UI.
- Local-first persistence requires a clear strategy for schema migrations to preserve data integrity across version updates.

**Session Summary:**
Completed the final major "Ingest" session. The wiki now provides 100% coverage of the i8e10 application's architectural principles, core features, specialized modules, and user interaction patterns. The knowledge base is now fully compiled and synchronized with the source code at `HEAD`.
