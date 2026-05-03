---
title: "Financial Health | நிதி ஆரோக்கியம்"
type: "feature"
status: "active"
source_paths: ["components/FinancialHealth.tsx", "utils/balanceCalculator.ts"]
updated_at: "2026-05-01"
---

# Financial Health | நிதி ஆரோக்கியம்

The Financial Health module provides users with high-level insights into their fiscal status.

## Core Metrics | முக்கிய அளவீடுகள்
- **Savings Ratio**: Percentage of income saved after expenses.
- **Net Flow**: Total income minus total expenses for the selected period.
- **Net Worth**: Total value across all wallets and investments minus outstanding debts.

## Data Calculation | தரவு கணக்கீடு
Metrics are computed dynamically in `utils/balanceCalculator.ts` using live queries from IndexedDB.
- **Periodic Flow**: Calculates totals within the current time-period filter.
- **Wallet Balances**: Real-time aggregation of the double-entry ledger for each account.

## Visualization | காட்சிப்படுத்தல்
The `FinancialHealth` component uses progress bars and color-coded cards to represent goals and budgets.
- **Surplus**: Shown in green with positive reinforcement.
- **Deficit**: Shown in red with a focus on recovery.

## Interlinks | இணைப்புகள்
- [Income Statement](income-statement.md) - Formal reporting of health metrics.
- [Investment Tracking](../modules/investment-tracking.md) - Contribution of assets to net worth.
- [Debt Management](../modules/debt-management.md) - Contribution of liabilities to net worth.
