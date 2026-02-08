
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import Modal from './ui/Modal';

interface ClearDataConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CONFIRMATION_TEXT = 'DELETE';

const ClearDataConfirmationModal: FC<ClearDataConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [inputText, setInputText] = useState('');
  const isConfirmed = inputText === CONFIRMATION_TEXT;

  useEffect(() => {
    if (isOpen) {
      setInputText('');
    }
  }, [isOpen]);

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!isConfirmed}
        className="btn-press inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        I understand, delete everything
      </button>
    </>
  );
  
  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Confirm Permanent Deletion" footer={footer}>
      <div className="space-y-4 text-slate-600 dark:text-slate-300">
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-300" role="alert">
          <p className="font-bold">This is a destructive action and cannot be undone.</p>
          <p className="mt-1">All your transactions, debts, investments, and custom wallet settings will be permanently erased from this device.</p>
        </div>
        
        <p>
          To confirm, please type <strong className="font-mono text-slate-800 dark:text-slate-100">{CONFIRMATION_TEXT}</strong> into the box below.
        </p>
        
        <div>
            <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={`${inputBaseClasses} text-center font-mono tracking-widest`}
                placeholder={CONFIRMATION_TEXT}
                autoFocus
            />
        </div>
      </div>
    </Modal>
  );
};

export default ClearDataConfirmationModal;
