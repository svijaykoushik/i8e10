import { db } from './db';
import * as accountingAdapter from './accountingAdapter';
import { investmentAccountId, SYSTEM_ACCOUNT_IDS } from '../src/db/accounts';
import { InvestmentTransaction, InvestmentTransactionType, Investment } from '../types';
import { TransactionEntry } from '../src/db/doubleEntryTypes';

/**
 * Saves an investment transaction and its corresponding double-entry transaction.
 * Removes all legacy manual transaction creation.
 */
export async function saveInvestmentTransaction(params: {
  transactionData: Omit<InvestmentTransaction, 'id'> & { id?: string };
  createTransaction: boolean;
  walletAccountId: string;
  appFirstUseDateExists: boolean;
}) {
  const { transactionData, createTransaction, walletAccountId, appFirstUseDateExists } = params;

  await db.transaction('rw', db.investmentTransactions, db.transactions_v2, db.investments, db.settings, async () => {
    if (!appFirstUseDateExists) {
      await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
    }

    const investment = await db.investments.get(transactionData.investmentId);
    const invName = investment?.name || 'Unknown Investment';
    const investmentTransactionId = transactionData.id || crypto.randomUUID();

    let description = '';
    switch (transactionData.type) {
      case InvestmentTransactionType.CONTRIBUTION:
        description = `Investment Top-up: ${invName}`;
        break;
      case InvestmentTransactionType.WITHDRAWAL:
        description = `Investment Withdrawal: ${invName}`;
        break;
      case InvestmentTransactionType.DIVIDEND:
      default:
        description = `Dividend: ${invName}`;
        break;
    }

    if (transactionData.id) {
      // Edit mode
      await db.investmentTransactions.update(investmentTransactionId, transactionData);

      // Update double-entry transaction if it exists
      const allV2 = await db.transactions_v2.toArray();
      const linkedV2 = allV2.find(t => t.meta?.investmentTransactionId === investmentTransactionId);

      if (linkedV2) {
        const invAccId = investmentAccountId(transactionData.investmentId);
        let updatedEntries: TransactionEntry[] = [];

        switch (transactionData.type) {
          case InvestmentTransactionType.CONTRIBUTION:
            updatedEntries = [
              { accountId: invAccId, type: 'debit', amount: transactionData.amount },
              { accountId: walletAccountId, type: 'credit', amount: transactionData.amount },
            ];
            break;
          case InvestmentTransactionType.WITHDRAWAL:
            updatedEntries = [
              { accountId: walletAccountId, type: 'debit', amount: transactionData.amount },
              { accountId: invAccId, type: 'credit', amount: transactionData.amount },
            ];
            break;
          case InvestmentTransactionType.DIVIDEND:
            updatedEntries = [
              { accountId: walletAccountId, type: 'debit', amount: transactionData.amount },
              { accountId: SYSTEM_ACCOUNT_IDS.INCOME, type: 'credit', amount: transactionData.amount },
            ];
            break;
        }

        await accountingAdapter.updateTransaction({
          ...linkedV2,
          date: transactionData.date,
          note: description,
          entries: updatedEntries,
        });
      }
    } else {
      // Add mode
      const newInvestmentTx: InvestmentTransaction = { 
        ...transactionData as InvestmentTransaction, 
        id: investmentTransactionId 
      };
      await db.investmentTransactions.add(newInvestmentTx);

      if (createTransaction) {
        try {
          switch (transactionData.type) {
            case InvestmentTransactionType.CONTRIBUTION:
              await accountingAdapter.recordInvestmentBuy({ 
                investmentId: transactionData.investmentId, 
                amount: transactionData.amount, 
                date: transactionData.date, 
                walletAccountId, 
                description,
                investmentTransactionId 
              });
              break;
            case InvestmentTransactionType.WITHDRAWAL:
              await accountingAdapter.recordInvestmentSell({ 
                investmentId: transactionData.investmentId, 
                amount: transactionData.amount, 
                date: transactionData.date, 
                walletAccountId, 
                description,
                investmentTransactionId 
              });
              break;
            case InvestmentTransactionType.DIVIDEND:
              await accountingAdapter.recordInvestmentDividend({ 
                investmentId: transactionData.investmentId, 
                amount: transactionData.amount, 
                date: transactionData.date, 
                walletAccountId, 
                description,
                investmentTransactionId 
              });
              break;
          }
        } catch (e) {
          console.error('v2 investment tx failed:', e);
        }
      }
    }
  });
}
