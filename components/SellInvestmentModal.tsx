

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Investment } from '../types';
import Modal from './ui/Modal';

interface SellInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { wallet: string; createTransaction: boolean; sellDate: string }) => void;
  investment: Investment | null;
  wallets: string[];
  onAlert: (title: string, message: string) => void;
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


const SellInvestmentModal: FC<SellInvestmentModalProps> = ({ isOpen, onClose, onConfirm, investment, wallets, onAlert }) => {
  const [wallet, setWallet] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);
  const [sellDate, setSellDate] = useState(getLocalDateString());

  useEffect(() => {
    if (isOpen) {
      setWallet(wallets.length > 0 ? wallets[0] : '');
      setCreateTransaction(true);
      setSellDate(getLocalDateString());
    }
  }, [isOpen, wallets]);

  if (!investment) return null;

  const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(investment.currentValue);
  
  const handleConfirm = () => {
    if (createTransaction && !wallet) {
      onAlert("Wallet Required", "Please select a wallet to record the transaction.");
      return;
    }
    onConfirm({ wallet, createTransaction, sellDate });
  };
  
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 004 0V7.151c.22.071.412.164.567.267C13.833 7.29 14 6.884 14 6.5 14 5.672 13.328 5 12.5 5h-5C6.672 5 6 5.672 6 6.5c0 .384.167.79.433.918z" /><path fillRule="evenodd" d="M7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        Yes, Confirm Sale
      </button>
    </>
  );

  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Sale of Investment" footer={footer}>
      <div className="text-slate-600 dark:text-slate-300 space-y-4">
        <p className="text-center">This will mark the entire investment as sold.</p>
        
        <div className="my-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-center">
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{investment.name}</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
                Sell for: {formattedAmount}
            </p>
        </div>

        <div>
            <label htmlFor="sell-date" className={labelClasses}>Sell Date</label>
            <div className="mt-2">
                <input type="date" id="sell-date" value={sellDate} onChange={e => setSellDate(e.target.value)} className={inputBaseClasses} />
            </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between">
                <label htmlFor="create-transaction-sell" className="flex flex-col cursor-pointer flex-grow pr-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                        Record sale as income
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Creates an income transaction for this sale.
                    </span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                        type="checkbox"
                        id="create-transaction-sell"
                        checked={createTransaction}
                        onChange={(e) => setCreateTransaction(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>
            {createTransaction && (
              <div className="animate-fadeInUp" style={{animationDuration: '0.3s'}}>
                <label htmlFor="wallet-sell" className={labelClasses}>
                    Add proceeds to wallet / பணத்தை கணக்கில் சேர்க்கவும்
                </label>
                <div className="mt-2">
                    <select 
                        id="wallet-sell" 
                        value={wallet} 
                        onChange={(e) => setWallet(e.target.value)} 
                        className={inputBaseClasses} 
                        required
                    >
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
            <div className="p-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-300" role="alert">
                <p className="font-medium text-center">
                    This will create a new <strong className="text-green-500">Income</strong> transaction of <strong>{formattedAmount}</strong> and a final withdrawal from the investment.
                </p>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default SellInvestmentModal;