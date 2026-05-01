# Forgiving Reconciliation | மன்னிக்கும் சமரசம்

The "Forgiving Reconciliation" pattern allows users to align their digital wallet balances with reality without requiring a perfect history of every transaction.

## Intent | நோக்கம்
To provide a low-friction way to correct balance discrepancies. Instead of forcing users to find a missing $2 expense from three weeks ago, they can simply "Reconcile" to the current known balance.

பயனர்கள் தங்கள் பணப்பையை சரிசெய்ய அனுமதிப்பது, ஒவ்வொரு சிறிய செலவையும் கணக்கிடத் தேவையில்லை. இது ஒரு எளிய திருத்த முறையாகும்.

## Architecture | கட்டடக்கலை
Reconciliation is implemented as a special type of double-entry transaction.

### Balancing via Equity | சமன்படுத்தும் முறை
When a user adjusts their balance, the system creates a transaction between the **Wallet Account** and the **Opening Balance (Equity) Account**.
- **If Balance Increases**: Debit Wallet, Credit Equity.
- **If Balance Decreases**: Debit Equity, Credit Wallet.

### Data Model | தரவு மாதிரி
- **Kind**: `adjustment`
- **Metadata**: `isReconciliation: true`
- **UI Treatment**: Reconciliation transactions are highlighted in the UI (often as "Adjustment") and are typically locked from editing to prevent accidental balance shifts.

## Implementation | அமலாக்கம்
The logic resides in `recordAdjustment` within the `accountingAdapter.ts`.

```typescript
// From accountingAdapter.ts
export async function recordAdjustment(params: { ... }) {
  // Positive adjustment: Debit → walletAccount, Credit → acc_equity_opening
  // Negative adjustment: Debit → acc_equity_opening, Credit → walletAccount
  // ...
  return createTransaction(..., 'adjustment', { isReconciliation: true });
}
```

## Lessons Learned | கற்றுக்கொண்ட பாடங்கள்
- **Audit Trail**: Even though it's a "correction," keeping it as a transaction ensures the ledger remains balanced and provides an audit trail of adjustments.
- **Equity Usage**: Using an Equity account (Opening Balance) for adjustments is cleaner than using a generic "Expense" or "Income" category, as it reflects a change in the starting state or unknown variance.

[[Double-Entry Ledger]] | [[Double-Entry Ledger]]
[[Accounting System]] | [[Accounting System]]
