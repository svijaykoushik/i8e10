
import React, { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { Investment } from '../types';
import Modal from './ui/Modal';

interface UpdateInvestmentValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newValue: number) => void;
  investment: Investment | null;
}

const UpdateInvestmentValueModal: FC<UpdateInvestmentValueModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  investment,
}) => {
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    if (isOpen && investment) {
      setCurrentValue(String(investment.currentValue));
    }
  }, [isOpen, investment]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numericValue = parseFloat(currentValue);
    if (isNaN(numericValue)) return;
    onUpdate(numericValue);
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
        form="update-investment-form"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Update Value
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Value for ${investment?.name || ''}`} footer={footer}>
      <form id="update-investment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentValue" className={labelClasses}>
            New Current Value / புதிய தற்போதைய மதிப்பு
          </label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              name="currentValue"
              id="currentValue"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className={`${inputBaseClasses} pl-7`}
              placeholder="0.00"
              required
              autoFocus
              step="0.01"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateInvestmentValueModal;