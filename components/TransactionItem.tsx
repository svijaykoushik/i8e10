import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Transaction, TransactionType } from '../types';


interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  isAnimatingOut: boolean;
  isFuture: boolean;
}

const TransactionItem: FC<TransactionItemProps> = ({ transaction, onEdit, onDelete, isAnimatingOut, isFuture }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isIncome = transaction.type === TransactionType.INCOME;
  const isReconciliation = transaction.isReconciliation;
  const isTransfer = !!transaction.transferId;
  const isDebt = !!transaction.debtId;
  const isEditDisabled = isReconciliation || isTransfer || isDebt;

  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const borderColor = isFuture
    ? 'border-cyan-200 dark:border-cyan-500/30 border-dashed'
    : isDebt
    ? 'border-orange-200 dark:border-orange-500/30'
    : isTransfer 
    ? 'border-blue-200 dark:border-blue-500/30'
    : isReconciliation 
    ? 'border-indigo-200 dark:border-indigo-500/30' 
    : isIncome 
    ? 'border-green-200 dark:border-green-500/30' 
    : 'border-red-200 dark:border-red-500/30';
  
  const iconBg = isDebt
    ? 'bg-orange-100 dark:bg-orange-500/20'
    : isTransfer
    ? 'bg-blue-100 dark:bg-blue-500/20'
    : isReconciliation
    ? 'bg-indigo-100 dark:bg-indigo-500/20'
    : isIncome
    ? 'bg-green-100 dark:bg-green-500/20'
    : 'bg-red-100 dark:bg-red-500/20';

  const iconColor = isDebt
    ? 'text-orange-500'
    : isTransfer
    ? 'text-blue-500'
    : isReconciliation
    ? 'text-indigo-500'
    : isIncome
    ? 'text-green-500'
    : 'text-red-500';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = async () => {
    const willBeOpen = !menuOpen;
    if (willBeOpen) {
      try {
      } catch (error) {
        console.error('Error tracking menu open:', error);
      }
    }
    setMenuOpen(willBeOpen);
  };

  const formattedDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount);

  const Icon = () => {
    let iconPath;
    if (isDebt) {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 9m18 3V9" />;
    } else if (isTransfer) {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18m0 0l-4 4m0 0l4-4" />;
    } else if (isReconciliation) {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
    } else if (isIncome) {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />;
    } else {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />;
    }
    
    return (
        <div className={`p-2 rounded-full ${iconBg}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {iconPath}
            </svg>
        </div>
    );
  };

  return (
    <li className={`relative bg-white dark:bg-slate-800 p-4 flex items-center gap-4 border-l-4 ${borderColor} rounded-r-lg shadow-sm ${isAnimatingOut ? 'animate-fadeOutDown' : 'animate-fadeInUp'} ${menuOpen ? 'z-40' : 'z-auto'}`}>
      <Icon />
      <div className="flex-grow">
        <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
          {transaction.description || (isIncome ? 'Income' : 'Expense')}
          {isReconciliation && <span className="ml-2 text-xs font-normal text-indigo-500 dark:text-indigo-400">(Adjustment)</span>}
          {isTransfer && <span className="ml-2 text-xs font-normal text-blue-500 dark:text-blue-400">(Transfer)</span>}
          {isDebt && <span className="ml-2 text-xs font-normal text-orange-500 dark:text-orange-400">(Debt)</span>}
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
          <span>{formattedDate}</span>
          {isFuture && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300">Future</span>}
          {transaction.wallet && (
              <>
                  <span className="font-bold">&middot;</span>
                  <span>{transaction.wallet}</span>
              </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className={`font-bold text-lg ${amountColor}`}>
          {isIncome ? '+' : '-'} {formattedAmount}
        </p>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={handleMenuToggle}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed dark:disabled:hover:bg-transparent group"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            title="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 origin-top-right">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button
                  onClick={() => { onEdit(transaction); setMenuOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  role="menuitem"
                  disabled={isEditDisabled}
                  title={
                    isTransfer ? "Transfers cannot be edited. Delete and recreate it instead." : 
                    isReconciliation ? "Adjustments cannot be edited." : 
                    isDebt ? "Debt-related transactions cannot be edited. Manage from the Debts tab." : 
                    "Edit transaction"
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                  Edit
                </button>
                <button
                  onClick={() => { onDelete(transaction); setMenuOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  role="menuitem"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default TransactionItem;