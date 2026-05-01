---
title: "Header Navigation | தலைப்பு வழிசெலுத்தல்"
type: "feature"
status: "active"
source_paths: ["App.tsx", "components/FilterControls.tsx"]
updated_at: "2026-05-01"
---

# Header Navigation | தலைப்பு வழிசெலுத்தல்

The header navigation manages global app actions and the primary filtering state for financial views.

## Overflow Menu | மேலதிக மெனு
To preserve negative space and maintain a clean UI, secondary global actions have been consolidated into an overflow menu (triple-dot icon).
- **Location**: `App.tsx` (Header section).
- **Items**:
  - **Reports**: Opens the [[Income Statement]] modal.
  - **Settings**: Opens the app configuration modal.
- **Accessibility**: Implements standard ARIA menu roles (`menu`, `menuitem`).

## Time-Period Filtering | கால-அளவீடு வடிகட்டுதல்
The application supports standardized time-period filtering across all primary views ([[Double-Entry Ledger]], Debts, and Investments).

### Standard Periods | நிலையான காலங்கள்
- **TODAY**: Current calendar day.
- **THIS_MONTH**: From the 1st of the current month to today.
- **LAST_MONTH**: The previous full calendar month.
- **LAST_3_MONTHS**: Rolling 90-day window from the start of the month 2 months ago.
- **YTD (Year to Date)**: From January 1st of the current year to today.
- **ALL**: Full transaction history.
- **CUSTOM**: User-defined start and end dates.

## Implementation | செயலாக்கம்
Filtering logic is centralized in `App.tsx` and propagated to list components. This ensures that when a user switches between "Transactions" and "Debts", the selected period (if applicable) remains consistent or resets according to view-specific rules.

## Interlinks | இணைப்புகள்
- [[Income Statement]] - Triggered via the overflow menu.
- [[UI Architecture]] - Global view management logic.
