

import React, { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { Debt, DebtInstallment, DebtType } from '../types';
import Modal from './ui/Modal';

interface SettleDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { settlementDate: string; createTransaction: boolean; wallet: string }) => void;
  debt: Debt | null;
  installments: DebtInstallment[] | null;
  wallets: string[];
}

const getLocalDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SettleDebtModal: FC<SettleDebtModalProps> = ({ isOpen, onClose, onConfirm, debt, installments, wallets }: SettleDebtModalProps) => {
  const [settlementDate, setSettlementDate] = useState(getLocalDateString());
  const [createTransaction, setCreateTransaction] = useState(true);
  const [wallet, setWallet] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettlementDate(getLocalDateString());
      setCreateTransaction(true);
      setWallet(wallets.length > 0 ? wallets[0] : '');
    }
  }, [isOpen, wallets]);
  
  if (!debt) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  
  
const { paidAmount, remainingAmount } = useMemo(() => {
    if (!debt) return { paidAmount: 0, remainingAmount: 0 };
    const paid = (installments || []).reduce((sum, inst) => sum + inst.amount, 0);
    return { paidAmount: paid, remainingAmount: Math.max(0, debt.amount - paid) };
}, [debt, installments]);

  const formattedRemaining = formatCurrency(remainingAmount);
  const isLent = debt.type === DebtType.LENT;
  const transactionType = isLent ? 'Income' : 'Expense';
  const transactionColor = isLent ? 'text-green-500' : 'text-red-500';

  const handleConfirm = () => {
    onConfirm({ settlementDate, createTransaction, wallet });
  };

  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";

  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Yes, Settle
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Settlement" footer={footer}>
      <div className="text-slate-600 dark:text-slate-300 space-y-4">
        <p className="text-center">Are you sure you want to settle this debt?</p>
        
        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-center space-y-2">
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {isLent ? `Lent to ${debt.person}` : `Owed to ${debt.person}`}
            </p>
            <div className="flex justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Total: {formatCurrency(debt.amount)}</span>
                <span>Paid: {formatCurrency(paidAmount)}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-600 pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">Remaining to settle / நிலுவை தொகை</p>
                <p className={`font-bold text-xl text-slate-700 dark:text-slate-200`}>{formattedRemaining}</p>
            </div>
        </div>

        <div>
            <label htmlFor="settlement-date" className={labelClasses}>
                Settlement Date / தீர்வு தேதி
            </label>
            <div className="mt-2">
                <input
                    type="date"
                    id="settlement-date"
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className={inputBaseClasses}
                    required
                />
            </div>
        </div>
        
        <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between">
                <label htmlFor="create-transaction-settle" className="flex flex-col cursor-pointer flex-grow pr-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                        {isLent ? 'Add income to balance' : 'Deduct expense from balance'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Creates a corresponding transaction.
                    </span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                        type="checkbox"
                        id="create-transaction-settle"
                        checked={createTransaction}
                        onChange={(e) => setCreateTransaction(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>
            {createTransaction && (
              <div className="animate-fadeInUp" style={{animationDuration: '0.3s'}}>
                <label htmlFor="wallet-settle" className={labelClasses}>
                  Wallet / கணக்கு
                </label>
                <div className="mt-2">
                  <select name="wallet-settle" id="wallet-settle" value={wallet} onChange={(e) => setWallet(e.target.value)} className={inputBaseClasses} required>
                    {wallets.length > 0 ? (
                        wallets.map(w => <option key={w} value={w}>{w}</option>)
                    ) : (
                        <option value="" disabled>No wallets found</option>
                    )}
                  </select>
                </div>
              </div>
            )}
        </div>

        {createTransaction && (
            <div className="p-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-300" role="alert">
                <p className="font-medium text-center">
                    This will create a new <strong className={transactionColor}>{transactionType}</strong> transaction of <strong>{formattedRemaining}</strong> and mark this item as settled.
                </p>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default SettleDebtModal;