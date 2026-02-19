import React, { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { Investment, Wallet } from '../types';
import Modal from './ui/Modal';


interface InvestmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    investmentData: Omit<Investment, 'id' | 'status' | 'currentValue'> & { id?: string };
    initialContribution?: number;
    currentValue?: number;
    createTransaction?: boolean;
    wallet?: string;
  }) => void;
  investmentToEdit?: Investment | null;
  wallets: Wallet[];
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const InvestmentFormModal: FC<InvestmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  investmentToEdit,
  wallets,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [initialContribution, setInitialContribution] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [isCurrentValueManuallySet, setIsCurrentValueManuallySet] = useState(false);
  const [createTransaction, setCreateTransaction] = useState(true);
  const [walletId, setWalletId] = useState('');
  
  const isEditMode = !!investmentToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setName(investmentToEdit.name);
        setType(investmentToEdit.type);
        setStartDate(investmentToEdit.startDate);
        setNotes(investmentToEdit.notes || '');
        // Fields for new investments are cleared
        setInitialContribution('');
        setCurrentValue('');
        setIsCurrentValueManuallySet(false);
        setCreateTransaction(true);
      } else {
        // Reset all fields for a new investment
        setName('');
        setType('');
        setStartDate(getLocalDateString());
        setNotes('');
        setInitialContribution('');
        setCurrentValue('');
        setIsCurrentValueManuallySet(false);
        setCreateTransaction(true);
        setWalletId(wallets.length > 0 ? wallets[0].id : '');
      }
    }
  }, [isOpen, investmentToEdit, isEditMode, wallets]);
  
  const handleContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInitialContribution(value);
    if (!isCurrentValueManuallySet) {
      setCurrentValue(value);
    }
  };

  const handleCurrentValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
    setIsCurrentValueManuallySet(true);
  };

  const handleCreateTransactionToggle = (isChecked: boolean) => {
    setCreateTransaction(isChecked);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !type || !startDate) return;
    
    const contributionAmount = parseFloat(initialContribution);
    const currentValueAmount = parseFloat(currentValue);

    onSave({
      investmentData: {
        id: isEditMode ? investmentToEdit.id : undefined,
        name,
        type,
        startDate,
        notes,
      },
      initialContribution: !isEditMode && contributionAmount > 0 ? contributionAmount : undefined,
      currentValue: !isEditMode && currentValueAmount > 0 ? currentValueAmount : undefined,
      createTransaction: !isEditMode && contributionAmount > 0 ? createTransaction : undefined,
      wallet: !isEditMode && contributionAmount > 0 && createTransaction ? walletId : undefined,
    });
    onClose();
  };
  
  const title = isEditMode ? 'Edit Investment / முதலீட்டை திருத்து' : 'Add Investment / முதலீடு சேர்';
  
  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button type="submit" form="investment-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {isEditMode ? 'Save Changes' : 'Save Investment'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <form id="investment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inv-name" className={labelClasses}>Investment Name / முதலீட்டின் பெயர்</label>
          <div className="mt-2">
            <input type="text" id="inv-name" value={name} onChange={(e) => setName(e.target.value)} className={inputBaseClasses} placeholder="e.g., Reliance Mutual Fund" required autoFocus/>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="inv-type" className={labelClasses}>Type / வகை</label>
                <div className="mt-2">
                    <input type="text" id="inv-type" value={type} onChange={(e) => setType(e.target.value)} className={inputBaseClasses} placeholder="e.g., Stock, Real Estate" required />
                </div>
            </div>
            <div>
                <label htmlFor="inv-date" className={labelClasses}>Start Date / தொடங்கிய தேதி</label>
                <div className="mt-2">
                    <input type="date" id="inv-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputBaseClasses} required />
                </div>
            </div>
        </div>
        
        {!isEditMode && (
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inv-initial" className={labelClasses}>Initial Contribution (Optional)</label>
                    <div className="relative mt-2 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-sm">₹</span></div>
                        <input type="number" id="inv-initial" value={initialContribution} onChange={handleContributionChange} className={`${inputBaseClasses} pl-7`} placeholder="0.00" step="0.01" />
                    </div>
                  </div>
                   <div>
                    <label htmlFor="inv-current-value" className={labelClasses}>Current Value (Optional)</label>
                    <div className="relative mt-2 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-sm">₹</span></div>
                        <input type="number" id="inv-current-value" value={currentValue} onChange={handleCurrentValueChange} className={`${inputBaseClasses} pl-7`} placeholder="0.00" step="0.01" />
                    </div>
                  </div>
              </div>

            {parseFloat(initialContribution) > 0 && (
              <div className="animate-fadeInUp space-y-4" style={{animationDuration: '0.3s'}}>
                 <div className="flex items-center justify-between pt-2">
                    <label htmlFor="create-transaction-investment" className="flex flex-col cursor-pointer flex-grow pr-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Create expense transaction</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Deducts the contribution from a wallet.</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input type="checkbox" id="create-transaction-investment" checked={createTransaction} onChange={(e) => handleCreateTransactionToggle(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {createTransaction && (
                    <div>
                        <label htmlFor="wallet-investment" className={labelClasses}>Deduct from wallet / கணக்கிலிருந்து கழிக்கவும்</label>
                        <div className="mt-2">
                            <select name="wallet-investment" id="wallet-investment" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={inputBaseClasses} required>
                                {wallets.length > 0 ? (
                                    wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                                ) : (
                                    <option value="" disabled>No wallets found</option>
                                )}
                            </select>
                        </div>
                    </div>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Use 'Initial Contribution' to log the money you put in now. Use 'Current Value' if it's already worth more or less than your contribution.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="inv-notes" className={labelClasses}>Notes (Optional) / குறிப்புகள் (விரும்பினால்)</label>
          <div className="mt-2">
            <textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputBaseClasses} placeholder="e.g., Folio number, details..."/>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default InvestmentFormModal;