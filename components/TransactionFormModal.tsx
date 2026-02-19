import React, { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { Transaction, TransactionType, Wallet } from '../types';
import Modal from './ui/Modal';


type FormMode = 'income' | 'expense' | 'transfer';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'isReconciliation' | 'transferId'> & { id?: string }) => void;
  onSaveTransfer: (data: { amount: number; date: string; fromWallet: string; toWallet: string; description: string }) => void;
  transactionToEdit?: Transaction | null;
  initialType?: TransactionType;
  initialData?: Partial<Transaction> | null;
  wallets: Wallet[];
  onAlert: (title: string, message: string) => void;
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INCOME_SUGGESTIONS = ['Salary / சம்பளம்', 'Freelance / பகுதிநேர வருமானம்', 'Gift / பரிசு', 'Bonus / போனஸ்', 'Interest / வட்டி', 'Dividend / ஈவுத்தொகை'];
const EXPENSE_SUGGESTIONS = ['Groceries / மளிகை', 'Bills / கட்டணங்கள்', 'Rent / வாடகை', 'Food / உணவு', 'Shopping / ஷாப்பிங்', 'Travel / பயணம்', 'Health / மருத்துவம்', 'Entertainment / பொழுதுபோக்கு'];
const TRANSFER_SUGGESTIONS = ['ATM Withdrawal / ஏடிஎம் எடுத்தல்', 'Bank Transfer / வங்கி பரிமாற்றம்', 'Credit Card Payment / கிரெடிட் கார்டு செலுத்துதல்', 'Savings / சேமிப்பு', 'To Digital Wallet / டிஜிட்டல் வாலட்டிற்கு'];

const TransactionFormModal: FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveTransfer,
  transactionToEdit,
  initialType,
  initialData,
  wallets,
  onAlert,
}) => {
  const [formMode, setFormMode] = useState<FormMode>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  
  const isEditMode = !!transactionToEdit;
  const isActionDisabled = transactionToEdit?.isReconciliation || !!initialData;
  const isTransfer = formMode === 'transfer';

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormMode(transactionToEdit.type as FormMode); // Should only be income/expense if editable
        setAmount(String(transactionToEdit.amount));
        setDescription(transactionToEdit.description);
        setDate(transactionToEdit.date);
        setFromWalletId(transactionToEdit.walletId || '');
      } else {
        const defaultWallet1 = wallets.length > 0 ? wallets[0].id : '';
        const defaultWallet2 = wallets.length > 1 ? wallets[1].id : '';
        setFormMode(initialData?.type || initialType || 'expense');
        setAmount(initialData?.amount?.toString() || '');
        setDescription(initialData?.description || '');
        setDate(initialData?.date || getLocalDateString());
        setFromWalletId(initialData?.walletId || defaultWallet1);
        setToWalletId(defaultWallet2);
      }
    }
  }, [isOpen, transactionToEdit, initialType, initialData, isEditMode, wallets]);

  const handleModeChange = async (newMode: FormMode) => {
    try {
      setFormMode(newMode);
    } catch (error) {
      console.error('Error tracking mode change:', error);
    }
  };
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount || !date || (isActionDisabled)) return;

    if (isTransfer) {
        if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) {
            onAlert("Invalid Transfer", "Please select two different wallets for the transfer.");
            return;
        }
        onSaveTransfer({
            amount: parseFloat(amount),
            date,
            fromWallet: fromWalletId,
            toWallet: toWalletId,
            description,
        });
    } else {
        onSave({
            id: isEditMode ? transactionToEdit.id : undefined,
            type: formMode as TransactionType,
            amount: parseFloat(amount),
            description,
            date,
            walletId: fromWalletId,
        });
    }
    onClose();
  };
  
  const getTitle = () => {
    if (isEditMode) return 'Edit Transaction / திருத்து';
    if (isTransfer) return 'Add Transfer / பண மாற்றம்';
    return formMode === 'income' ? 'Add Income / வரவு சேர்' : 'Add Expense / செலவு சேர்';
  };
  
  const suggestions = formMode === 'income' 
    ? INCOME_SUGGESTIONS 
    : formMode === 'expense' 
    ? EXPENSE_SUGGESTIONS
    : TRANSFER_SUGGESTIONS;

  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
      <button type="submit" form="transaction-form" disabled={(isTransfer && (!fromWalletId || !toWalletId || fromWalletId === toWalletId))} className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed">
        {isEditMode ? 'Save Changes' : 'Save Transaction'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} footer={footer}>
      {(isActionDisabled && !isEditMode) && (
         <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
          <span className="font-medium">Notice!</span> This form is pre-filled. Type switching is disabled.
        </div>
      )}
      {transactionToEdit?.isReconciliation && (
        <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
          <span className="font-medium">Warning!</span> Balance adjustments cannot be edited.
        </div>
      )}
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={labelClasses}>Type / வகை</label>
          <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-slate-200 dark:bg-slate-900 p-1">
            <button type="button" onClick={() => handleModeChange('expense')} disabled={isActionDisabled} className={`py-2 text-sm font-semibold rounded-md transition-colors ${formMode === 'expense' ? 'bg-red-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'} disabled:opacity-70 disabled:cursor-not-allowed`}>Expense</button>
            <button type="button" onClick={() => handleModeChange('income')} disabled={isActionDisabled} className={`py-2 text-sm font-semibold rounded-md transition-colors ${formMode === 'income' ? 'bg-green-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'} disabled:opacity-70 disabled:cursor-not-allowed`}>Income</button>
            <button type="button" onClick={() => handleModeChange('transfer')} disabled={isActionDisabled} className={`py-2 text-sm font-semibold rounded-md transition-colors ${formMode === 'transfer' ? 'bg-blue-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'} disabled:opacity-70 disabled:cursor-not-allowed`}>Transfer</button>
          </div>
        </div>
        <div>
          <label htmlFor="amount" className={labelClasses}>Amount / தொகை</label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-sm">₹</span></div>
            <input type="number" name="amount" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputBaseClasses} pl-7`} placeholder="0.00" required autoFocus />
          </div>
        </div>
        
        {isTransfer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                    <label htmlFor="fromWallet" className={labelClasses}>From Wallet / கணக்கிலிருந்து</label>
                    <div className="mt-2">
                        <select name="fromWallet" id="fromWallet" value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)} className={inputBaseClasses} required disabled={isActionDisabled}>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="toWallet" className={labelClasses}>To Wallet / கணக்கிற்கு</label>
                    <div className="mt-2">
                        <select name="toWallet" id="toWallet" value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className={inputBaseClasses} required disabled={isActionDisabled}>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                         {fromWalletId === toWalletId && fromWalletId !== '' && <p className="text-xs text-red-500 mt-1">Wallets cannot be the same.</p>}
                    </div>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                    <label htmlFor="date" className={labelClasses}>Date / தேதி</label>
                    <div className="mt-2"><input type="date" name="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputBaseClasses} required /></div>
                </div>
                <div>
                    <label htmlFor="wallet" className={labelClasses}>Wallet / கணக்கு</label>
                    <div className="mt-2">
                       <select name="wallet" id="wallet" value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)} className={inputBaseClasses} required>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        )}
        
        {isTransfer && (
            <div>
                 <label htmlFor="date" className={labelClasses}>Date / தேதி</label>
                <div className="mt-2"><input type="date" name="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputBaseClasses} required /></div>
            </div>
        )}

        <div>
          <label htmlFor="description" className={labelClasses}>Description (Optional) / விளக்கம் (விரும்பினால்)</label>
          <div className="mt-2"><input type="text" name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputBaseClasses} placeholder={isTransfer ? 'e.g., ATM Withdrawal' : (formMode === 'income' ? 'Salary...' : 'Groceries...')} /></div>
           <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map(suggestion => (
              <button key={suggestion} type="button" onClick={() => setDescription(suggestion)} disabled={isActionDisabled} className="py-1 px-3 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionFormModal;