
import React from 'react';
import type { FC } from 'react';
import { Transaction, Wallet } from '../types';
import TransactionItem from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  animatingOutIds: string[];
  today: Date;
  wallets: Wallet[];
}

const TransactionList: FC<TransactionListProps> = ({ transactions, onEdit, onDelete, animatingOutIds, today, wallets }) => {
  if (transactions.length === 0 && animatingOutIds.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">No Transactions Found</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          No entries match your current filters, or you haven't added any yet.
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        செயல்பாடுகள் எதுவும் இல்லை.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {transactions.map(tx => (
        <TransactionItem 
            key={tx.id} 
            transaction={tx} 
            onEdit={onEdit} 
            onDelete={onDelete}
            isAnimatingOut={animatingOutIds.includes(tx.id)}
            isFuture={new Date(tx.date + 'T00:00:00') > today}
            wallets={wallets}
        />
      ))}
    </ul>
  );
};

export default TransactionList;