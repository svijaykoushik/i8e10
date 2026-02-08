import React, { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { Investment, InvestmentTransaction, InvestmentTransactionType } from '../types';
import Modal from './ui/Modal';
import { trackUserAction } from '../utils/tracking';

interface InvestmentTransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    transactionData: Omit<InvestmentTransaction, 'id'> & { id?: string };
    createTransaction: boolean;
    wallet: string;
  }) => void;
  investment: Investment | null;
  investmentTransactionToEdit: InvestmentTransaction | null;
  wallets: string[];
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const InvestmentTransactionFormModal: FC<InvestmentTransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  investment,
  investmentTransactionToEdit,
  wallets,
}) => {
  const [type, setType] = useState<InvestmentTransactionType>(InvestmentTransactionType.CONTRIBUTION);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);
  const [wallet, setWallet] = useState('');

  const isEditMode = !!investmentTransactionToEdit;
  const investmentForTitle = investment || (investmentTransactionToEdit ? {name: '...'} : null);

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && investmentTransactionToEdit) {
            setType(investmentTransactionToEdit.type);
            setAmount(String(investmentTransactionToEdit.amount));
            setDate(investmentTransactionToEdit.date);
            setNotes(investmentTransactionToEdit.notes || '');
        } else {
            setType(InvestmentTransactionType.CONTRIBUTION);
            setAmount('');
            setDate(getLocalDateString());
            setNotes('');
            setCreateTransaction(true);
            setWallet(wallets.length > 0 ? wallets[0] : '');
        }
    }
  }, [isOpen, investmentTransactionToEdit, isEditMode, wallets]);

  const handleTypeChange = async (newType: InvestmentTransactionType) => {
    try {
      await trackUserAction('investment_tx_form_change_type', { new_type: newType, previous_type: type });
      setType(newType);
    } catch (error) {
      console.error('Error tracking type change:', error);
    }
  };

  const handleCreateTransactionToggle = async (isChecked: boolean) => {
    try {
      await trackUserAction('investment_tx_form_toggle_create_transaction', { is_checked: isChecked });
      setCreateTransaction(isChecked);
    } catch (error) {
      console.error('Error tracking toggle:', error);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parentInvestmentId = investment?.id || investmentTransactionToEdit?.investmentId;
    if (!parentInvestmentId || !amount || !date || (createTransaction && !wallet && !isEditMode)) return;
    
    onSave({
      transactionData: {
        id: isEditMode ? investmentTransactionToEdit.id : undefined,
        investmentId: parentInvestmentId,
        type,
        amount: parseFloat(amount),
        date,
        notes,
      },
      createTransaction: !isEditMode && createTransaction,
      wallet: !isEditMode ? wallet : '',
    });
  };

  const getTransactionTypeLabel = () => {
    switch (type) {
        case InvestmentTransactionType.CONTRIBUTION: return 'Deduct from balance';
        case InvestmentTransactionType.WITHDRAWAL: return 'Add withdrawal to balance';
        case InvestmentTransactionType.DIVIDEND: return 'Add dividend to balance';
    }
  };

  const title = isEditMode 
    ? `Edit Transaction in ${investmentForTitle?.name}` 
    : `Add Transaction to ${investmentForTitle?.name}`;
  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button type="submit" form="investment-tx-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {isEditMode ? 'Save Changes' : 'Save Transaction'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <form id="investment-tx-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className={labelClasses}>Type</label>
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-slate-200 dark:bg-slate-900 p-1">
                <button type="button" onClick={() => handleTypeChange(InvestmentTransactionType.CONTRIBUTION)} className={`py-2 text-sm font-semibold rounded-md transition-colors ${type === InvestmentTransactionType.CONTRIBUTION ? 'bg-blue-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>Contribution</button>
                <button type="button" onClick={() => handleTypeChange(InvestmentTransactionType.WITHDRAWAL)} className={`py-2 text-sm font-semibold rounded-md transition-colors ${type === InvestmentTransactionType.WITHDRAWAL ? 'bg-orange-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>Withdrawal</button>
                <button type="button" onClick={() => handleTypeChange(InvestmentTransactionType.DIVIDEND)} className={`py-2 text-sm font-semibold rounded-md transition-colors ${type === InvestmentTransactionType.DIVIDEND ? 'bg-green-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>Dividend</button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="inv-tx-amount" className={labelClasses}>Amount</label>
                <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-sm">₹</span></div>
                    <input type="number" id="inv-tx-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputBaseClasses} pl-7`} placeholder="0.00" required autoFocus step="0.01" />
                </div>
            </div>
            <div>
                <label htmlFor="inv-tx-date" className={labelClasses}>Date</label>
                <div className="mt-2">
                    <input type="date" id="inv-tx-date" value={date} onChange={(e) => setDate(e.target.value)} className={inputBaseClasses} required />
                </div>
            </div>
        </div>
        
        <div className={`p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 space-y-4 ${isEditMode ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
                <label htmlFor="create-transaction-investment" className="flex flex-col cursor-pointer flex-grow pr-4">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                    {getTransactionTypeLabel()}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    Creates a corresponding main transaction.
                </span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" id="create-transaction-investment" checked={createTransaction} onChange={(e) => handleCreateTransactionToggle(e.target.checked)} className="sr-only peer" disabled={isEditMode} />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>
            {createTransaction && (
              <div className="animate-fadeInUp" style={{animationDuration: '0.3s'}}>
                <label htmlFor="wallet-investment-tx" className={labelClasses}>Wallet</label>
                <div className="mt-2">
                  <select id="wallet-investment-tx" value={wallet} onChange={(e) => setWallet(e.target.value)} className={inputBaseClasses} required disabled={isEditMode}>
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

        <div>
            <label htmlFor="inv-tx-notes" className={labelClasses}>Notes (Optional)</label>
            <div className="mt-2">
                <input type="text" id="inv-tx-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputBaseClasses} placeholder="e.g., SIP installment" />
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default InvestmentTransactionFormModal;