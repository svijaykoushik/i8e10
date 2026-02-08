

import React from 'react';
import type { FC } from 'react';
import { Transaction, Debt, Investment, DebtType, InvestmentTransaction, InvestmentTransactionType, DebtInstallment } from '../types';
import Modal from './ui/Modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemToDelete: Transaction | Debt | DebtInstallment | Investment | InvestmentTransaction | null;
}

const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, itemToDelete }) => {
  if (!itemToDelete) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const isAdjustment = 'isReconciliation' in itemToDelete && itemToDelete.isReconciliation;
  const isInvestment = 'startDate' in itemToDelete;

  const renderItemDetails = () => {
    // Investment Transaction
    if ('investmentId' in itemToDelete && 'type' in itemToDelete && typeof itemToDelete.type === 'string' && Object.values(InvestmentTransactionType).includes(itemToDelete.type as InvestmentTransactionType)) {
        const tx = itemToDelete as InvestmentTransaction;
        return (
             <>
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100 capitalize">{tx.type} Transaction</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(tx.amount)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formatDate(tx.date)}</p>
            </>
        )
    }
    // Debt
    if ('person' in itemToDelete) {
        const debt = itemToDelete as Debt;
        return (
            <>
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{debt.type === DebtType.LENT ? `Lent to ${debt.person}` : `Owed to ${debt.person}`}</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(debt.amount)}</p>
                {debt.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{debt.description}</p>}
            </>
        );
    }
    // Investment
    if (isInvestment) {
        const investment = itemToDelete as Investment;
        return (
            <>
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{investment.name}</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{investment.type}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Current Value: {formatCurrency(investment.currentValue)}</p>
            </>
        );
    }
    // Transaction
    const transaction = itemToDelete as Transaction;
    return (
        <>
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{transaction.description || (transaction.type === 'income' ? 'Income' : 'Expense')}</p>
            <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(transaction.amount)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(transaction.date)}</p>
        </>
    );
  };
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="btn-press inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Yes, Delete
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" footer={footer}>
      <div className="text-slate-600 dark:text-slate-300">
        <p className="text-center">Are you sure you want to permanently delete this item?</p>
        
        {(isAdjustment || isInvestment) && (
            <div className="mt-4 p-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 text-left" role="alert">
                <p className="font-medium">Warning!</p>
                {isAdjustment && <p>Deleting this balance adjustment may cause your balance to become inaccurate.</p>}
                {isInvestment && <p>Deleting this investment will also permanently delete all of its associated transactions (contributions, withdrawals, etc.).</p>}
            </div>
        )}

        <div className="my-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-center">
            {renderItemDetails()}
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;