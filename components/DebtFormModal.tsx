import React, { useState, useEffect, useRef } from 'react';
import type { FC, FormEvent } from 'react';
import { Debt, DebtType } from '../types';
import Modal from './ui/Modal';
import { trackUserAction } from '../utils/tracking';

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    debtData: Omit<Debt, 'id' | 'status'> & { id?: string };
    createTransaction: boolean;
    wallet: string;
  }) => void;
  debtToEdit?: Debt | null;
  initialType?: DebtType;
  wallets: string[];
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DebtFormModal: FC<DebtFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  debtToEdit,
  initialType,
  wallets,
}) => {
  const [type, setType] = useState(DebtType.LENT);
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [createTransaction, setCreateTransaction] = useState(false);
  const [wallet, setWallet] = useState('');
  const personInputRef = useRef<HTMLInputElement>(null);
  
  const isEditMode = !!debtToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setType(debtToEdit.type);
        setPerson(debtToEdit.person);
        setAmount(String(debtToEdit.amount));
        setDescription(debtToEdit.description);
        setDate(debtToEdit.date);
      } else {
        setType(initialType || DebtType.LENT);
        setPerson('');
        setAmount('');
        setDescription('');
        setDate(getLocalDateString());
        setCreateTransaction(false);
        setWallet(wallets.length > 0 ? wallets[0] : '');
      }
      setTimeout(() => personInputRef.current?.focus(), 50);
    }
  }, [isOpen, debtToEdit, initialType, isEditMode, wallets]);
  
  const handleTypeChange = async (newType: DebtType) => {
    try {
      await trackUserAction('debt_form_change_type', { new_type: newType, previous_type: type });
      setType(newType);
    } catch (error) {
      console.error('Error tracking type change:', error);
    }
  };

  const handleCreateTransactionToggle = async (isChecked: boolean) => {
    try {
      await trackUserAction('debt_form_toggle_create_transaction', { is_checked: isChecked });
      setCreateTransaction(isChecked);
    } catch (error) {
      console.error('Error tracking toggle:', error);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount || !date || !person || (createTransaction && !wallet)) return;
    
    onSave({
      debtData: {
        id: isEditMode ? debtToEdit.id : undefined,
        type,
        person,
        amount: parseFloat(amount),
        description,
        date,
      },
      createTransaction: !isEditMode && createTransaction,
      wallet,
    });
  };
  
  const title = isEditMode 
    ? 'Edit Debt / கடனை திருத்து' 
    : (type === DebtType.LENT ? 'Add Lent Money / கொடுத்த கடன்' : 'Add Owed Money / வாங்கிய கடன்');
  
  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button type="submit" form="debt-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {isEditMode ? 'Save Changes' : 'Save Record'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <form id="debt-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={labelClasses}>Type / வகை</label>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-200 dark:bg-slate-900 p-1">
            <button type="button" onClick={() => handleTypeChange(DebtType.LENT)} className={`py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${type === DebtType.LENT ? 'bg-blue-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
              Lent / கொடுத்தது
            </button>
            <button type="button" onClick={() => handleTypeChange(DebtType.OWED)} className={`py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${type === DebtType.OWED ? 'bg-orange-500 text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
              Owed / வாங்கியது
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="person" className={labelClasses}>Person / நபர்</label>
          <div className="mt-2">
            <input ref={personInputRef} type="text" name="person" id="person" value={person} onChange={(e) => setPerson(e.target.value)} className={inputBaseClasses} placeholder="e.g., John Doe" required />
          </div>
        </div>
        <div>
          <label htmlFor="amount" className={labelClasses}>Amount / தொகை</label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">₹</span>
            </div>
            <input type="number" name="amount" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputBaseClasses} pl-7`} placeholder="0.00" required />
          </div>
        </div>
        <div>
          <label htmlFor="date" className={labelClasses}>Date / தேதி</label>
          <div className="mt-2">
            <input type="date" name="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputBaseClasses} required />
          </div>
        </div>
        <div>
          <label htmlFor="description" className={labelClasses}>Description (Optional) / விளக்கம் (விரும்பினால்)</label>
          <div className="mt-2">
            <input type="text" name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputBaseClasses} placeholder="e.g., For lunch" />
          </div>
        </div>
        
        {!isEditMode && (
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="create-transaction" className="flex flex-col cursor-pointer flex-grow pr-4">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {type === DebtType.LENT ? 'Deduct from balance' : 'Add to balance'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Creates a corresponding transaction.
                </span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  id="create-transaction"
                  checked={createTransaction}
                  onChange={(e) => handleCreateTransactionToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {createTransaction && (
              <div className="animate-fadeInUp" style={{animationDuration: '0.3s'}}>
                <label htmlFor="wallet" className={labelClasses}>
                  Wallet / கணக்கு
                </label>
                <div className="mt-2">
                  <select name="wallet" id="wallet" value={wallet} onChange={(e) => setWallet(e.target.value)} className={inputBaseClasses} required>
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
        )}
      </form>
    </Modal>
  );
};

export default DebtFormModal;
