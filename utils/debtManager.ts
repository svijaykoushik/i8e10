import { db } from './db';
import * as accountingAdapter from './accountingAdapter';
import { debtAccountId } from '../src/db/accounts';
import { Debt, DebtInstallment, DebtStatus, DebtType } from '../types';
import { TransactionEntry } from '../src/db/doubleEntryTypes';

/**
 * Saves a debt installment and its corresponding double-entry transaction.
 * Removes all legacy manual transaction creation.
 */
export async function saveDebtInstallment(params: {
  installmentData: Omit<DebtInstallment, 'id'> & { id?: string };
  createTransaction: boolean;
  markAsSettled: boolean;
  walletAccountId: string;
  createSurplusRecord?: boolean;
  debtForInstallment: Debt;
  appFirstUseDateExists: boolean;
}) {
  const { 
    installmentData, 
    createTransaction, 
    markAsSettled, 
    walletAccountId, 
    createSurplusRecord, 
    debtForInstallment, 
    appFirstUseDateExists 
  } = params;

  await db.transaction(
    "rw",
    db.debts,
    db.debtInstallements,
    db.transactions_v2,
    db.settings,
    async () => {
      const linkedDebt = await db.debts.get(installmentData.debtId);
      const allInstallments: DebtInstallment[] = await db.debtInstallements
        .where({ debtId: installmentData.debtId })
        .toArray();

      if (!appFirstUseDateExists) {
        await db.settings.put({
          key: "appFirstUseDate",
          value: new Date().toISOString(),
        });
      }

      const isLent = debtForInstallment.type === DebtType.LENT;
      const installmentId = installmentData.id || crypto.randomUUID();

      if (installmentData.id) {
        // Edit mode
        await db.debtInstallements.update(installmentId, { ...installmentData });

        // Update double-entry transaction if it exists
        const allV2 = await db.transactions_v2.toArray();
        const linkedV2 = allV2.find(t => t.meta?.debtInstallmentId === installmentId);

        if (linkedV2) {
          const debtAccId = debtAccountId(debtForInstallment.id, isLent ? 'lent' : 'owed');
          const updatedEntries: TransactionEntry[] = isLent
            ? [
                { accountId: walletAccountId, type: 'debit', amount: installmentData.amount },
                { accountId: debtAccId, type: 'credit', amount: installmentData.amount },
              ]
            : [
                { accountId: debtAccId, type: 'debit', amount: installmentData.amount },
                { accountId: walletAccountId, type: 'credit', amount: installmentData.amount },
              ];

          await accountingAdapter.updateTransaction({
            ...linkedV2,
            date: installmentData.date,
            note: isLent 
              ? `Payment received from ${debtForInstallment.person}` 
              : `Payment made to ${debtForInstallment.person}`,
            entries: updatedEntries,
          });
        }
      } else {
        // Add mode
        const newInstallment: DebtInstallment = {
          ...installmentData as DebtInstallment,
          id: installmentId,
        };
        await db.debtInstallements.add(newInstallment);

        if (createTransaction) {
          try {
            const dType = isLent ? 'lent' : 'owed';
            await accountingAdapter.recordDebtPayment({
              debtId: debtForInstallment.id,
              debtType: dType,
              amount: installmentData.amount,
              date: installmentData.date,
              walletAccountId: walletAccountId,
              note: isLent 
                ? `Payment received from ${debtForInstallment.person}` 
                : `Payment made to ${debtForInstallment.person}`,
              debtInstallmentId: installmentId,
            });
          } catch (e) {
            console.error('v2 debt payment failed:', e);
          }
        }
      }

      // Handle debt status
      const newStatus = markAsSettled ? DebtStatus.SETTLED : DebtStatus.OUTSTANDING;
      await db.debts.update(debtForInstallment.id, { status: newStatus });

      // Handle Surplus (Overpayment) - Create New Debt Record
      if (createSurplusRecord) {
        const paidPreviously = allInstallments.reduce((sum, i) => sum + i.amount, 0);
        const remaining = Math.max(0, (linkedDebt?.amount || 0) - paidPreviously);
        const surplusAmount = Math.max(0, installmentData.amount - remaining);

        if (surplusAmount > 0) {
          const newDebtType = isLent ? DebtType.OWED : DebtType.LENT;
          const newDebt: Debt = {
            id: crypto.randomUUID(),
            type: newDebtType,
            person: debtForInstallment.person,
            amount: surplusAmount,
            description: `Overpayment from previous ${isLent ? "loan" : "debt"} settlement`,
            date: installmentData.date,
            status: DebtStatus.OUTSTANDING,
          };
          await db.debts.add(newDebt);
        }
      }
    }
  );
}
