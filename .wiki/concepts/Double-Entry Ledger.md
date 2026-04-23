# Double-Entry Ledger | இரட்டை பதிவு பேரேடு

The foundation of the i8e10 accounting system is a double-entry ledger. This replaces the legacy single-entry "transaction items" to provide professional-grade financial tracking and reconciliation.

## Intent | நோக்கம்
To ensure every financial event is recorded with balanced debits and credits, preventing "missing money" and enabling complex flows like transfers and debt tracking.

துல்லியமான நிதி கண்காணிப்பிற்காக ஒவ்வொரு பரிவர்த்தனையும் குறைந்தது இரண்டு கணக்குகளை பாதிப்பதை உறுதி செய்வது. இது நிதி இழப்பைத் தடுக்கிறது.

## Architecture | கட்டடக்கலை
Every financial event is stored in the `transactions_v2` table as a `DoubleEntryTransaction`.

### Balanced Entries | சமநிலைப் பதிவுகள்
A transaction is only valid if the sum of all debits equals the sum of all credits.
- **Debit (பற்று)**: Increases assets/expenses or decreases liabilities/equity/income.
- **Credit (வரவு)**: Increases liabilities/equity/income or decreases assets/expenses.

### Transaction Kinds | பரிவர்த்தனை வகைகள்
The system tracks various kinds of transactions via `meta.kind`:
- `expense`, `income`, `transfer`
- `debt_create`, `debt_payment`
- `investment_buy`, `investment_sell`
- `adjustment` (used for reconciliation)

### Denormalized Indexing | குறியீட்டு முறை
To efficiently query transactions by account, the system maintains a denormalized `entryAccountIds` array in each transaction. This is indexed using IndexedDB's `multiEntry` feature.

## Example Flow: Simple Expense | உதாரணம்: செலவு
When you buy coffee for $5 using your "Cash" wallet:
1. **Debit**: Expense Account ($5)
2. **Credit**: Cash Wallet ($5)

## Lessons Learned | கற்றுக்கொண்ட பாடங்கள்
- **Atomic Validation**: Always use `validateBalancedEntries` before saving to prevent corrupt ledger states.
- **Source IDs**: During migration, keeping a `sourceId` in the meta field is essential for verifying data parity between the old and new systems.

[[Core Database]] | [[Core Database]]
[[Forgiving Reconciliation]] | [[Forgiving Reconciliation]]
