---
title: "Investment Tracking | முதலீட்டு கண்காணிப்பு"
type: "module"
status: "active"
source_paths: ["utils/investmentManager.ts", "components/InvestmentList.tsx"]
updated_at: "2026-05-01"
---

# Investment Tracking | முதலீட்டு கண்காணிப்பு

The Investment module tracks long-term assets and their performance over time.

## Core Entities | முக்கிய உட்பொருள்கள்
- **Investment**: An asset with a purchase price and a current market value.
- **Investment Transaction**: Contributions (buying more) or withdrawals (selling).

## Valuation Model | மதிப்பீட்டு மாதிரி
Investments in i8e10 use a **Point-in-Time Valuation** model.
- **Cost Basis**: The total amount invested (Contributions - Withdrawals).
- **Current Value**: Manually updated by the user to reflect market changes.
- **Gain/Loss**: The difference between Cost Basis and Current Value.

## Accounting Integration | கணக்கியல் ஒருங்கிணைப்பு
Investments are treated as a special class of accounts in the [[Double-Entry Ledger]].
- **Contribution**: Wallet (Credit) -> Investment Account (Debit).
- **Withdrawal**: Investment Account (Credit) -> Wallet (Debit).
- **Valuation Change**: Does not affect the ledger until realized (withdrawn), but is tracked for net-worth calculation.

## Interaction | தொடர்பு
Users can:
- **Buy/Add**: Increase the contribution.
- **Sell/Redeem**: Withdraw funds back to a wallet.
- **Update Value**: Adjust the current market price to track unrealized gains.

## Tamil Terminology | தமிழ் கலைச்சொற்கள்
- **Investment**: முதலீடு
- **Current Value**: தற்போதைய மதிப்பு
- **Gain/Loss**: லாபம்/நஷ்டம்

## Interlinks | இணைப்புகள்
- [[Accounting System]] - Ledger integration.
- [[Financial Health]] - How investments contribute to savings and net worth.
