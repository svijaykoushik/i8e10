---
title: "Income Statement | வருமான அறிக்கை"
type: "feature"
status: "active"
source_paths: ["utils/pdfGenerator.ts", "components/ReportModal.tsx", "utils/numberToWords.ts"]
updated_at: "2026-05-01"
---

# Income Statement | வருமான அறிக்கை

The Income Statement feature allows users to generate professional, accounting-grade PDF reports of their financial status for selected periods.

## Overview | மேலோட்டம்
This feature implements a client-side PDF generation pipeline using `jsPDF`. It transforms raw ledger entries into a structured financial statement, including:
- **Total Income** (Top Line)
- **Total Expenses**
- **Net Surplus/Deficit** (Bottom Line)

## Key Components | முக்கிய கூறுகள்

### 1. PDF Generation Pipeline | PDF உருவாக்கக் குழாய்
- **Location**: `utils/pdfGenerator.ts`
- **Engine**: `jsPDF` + `jspdf-autotable`.
- **Formatting**: Adheres to Indian financial standards (en-IN locale, Rs symbol, DD/MM/YYYY dates).
- **Design**: Professional letterpad layout with 1cm borders and optimized negative space.

### 2. Amount to Words | தொகையைச் சொற்களாக மாற்றுதல்
- **Location**: `utils/numberToWords.ts`
- **Logic**: Converts numeric totals into their word equivalents following the Indian numbering system (e.g., "Ten Thousand Rupees Only"). 
- **Context**: Used in the PDF to provide redundancy and prevent tampering/misinterpretation of totals.

### 3. Report Trigger | அறிக்கை தூண்டுதல்
- **Location**: `components/ReportModal.tsx`
- **Behavior**: Accessible via the [Header Navigation](header-navigation.md) overflow menu. Allows users to select predefined periods (YTD, Last 3 Months, etc.) or custom date ranges.

## Accounting Logic | கணக்கியல் தர்க்கம்
The report calculates totals by iterating through [Double-Entry Ledger](../concepts/double-entry-ledger.md) records. 
- **Net Surplus**: Total Income > Total Expenses.
- **Net Deficit**: Total Expenses > Total Income.
- **Disclaimer**: Every report includes a fine print stating that data is based on application entries and should be verified against actual records.

## Interlinks | இணைப்புகள்
- [Double-Entry Ledger](../concepts/double-entry-ledger.md) - The data source for reports.
- [Header Navigation](header-navigation.md) - Where the report generation is triggered.
