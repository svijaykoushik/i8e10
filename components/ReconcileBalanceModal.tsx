import React, { useState, useEffect, useMemo } from 'react';
import type { FC, FormEvent } from 'react';
import Modal from './ui/Modal';

interface ReconcileBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconcile: (actualBalance: number) => void;
  currentBalance: number;
}

const ReconcileBalanceModal: FC<ReconcileBalanceModalProps> = ({
  isOpen,
  onClose,
  onReconcile,
  currentBalance,
}) => {
  const [actualBalance, setActualBalance] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActualBalance('');
    }
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const difference = useMemo(() => {
    const numericActual = parseFloat(actualBalance);
    if (isNaN(numericActual)) {
      return null;
    }
    return numericActual - currentBalance;
  }, [actualBalance, currentBalance]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numericActual = parseFloat(actualBalance);
    if (isNaN(numericActual)) return;
    onReconcile(numericActual);
  };

  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button
        type="submit"
        form="reconcile-form"
        disabled={difference === null}
        className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Confirm and Adjust
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reconcile Balance / இருப்பை சரிபார்க்கவும்" footer={footer}>
      <form id="reconcile-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-center text-slate-600 dark:text-slate-300">
            Your current balance in the app is{' '}
            <strong className="text-slate-800 dark:text-slate-100">{formatCurrency(currentBalance)}</strong>.
          </p>
        </div>
        <div>
          <label htmlFor="actualBalance" className={labelClasses}>
            What is your actual balance?
          </label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              name="actualBalance"
              id="actualBalance"
              value={actualBalance}
              onChange={(e) => setActualBalance(e.target.value)}
              className={`${inputBaseClasses} pl-7`}
              placeholder="0.00"
              required
              autoFocus
              step="0.01"
            />
          </div>
        </div>
        {difference !== null && Math.abs(difference) >= 0.01 && (
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This will create a{' '}
              <strong className={difference < 0 ? 'text-red-500' : 'text-green-500'}>
                {formatCurrency(Math.abs(difference))}
              </strong>{' '}
              transaction to match your balance.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ReconcileBalanceModal;