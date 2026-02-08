import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { FilterPeriod } from '../types';
import Modal from './ui/Modal';
import useTheme from '../hooks/useTheme';
import { trackUserAction } from '../utils/tracking';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDefault: FilterPeriod;
  currentDefaultWallet: string;
  wallets: string[];
  currentDeficitThreshold: number;
  onSave: (
    newDefault: FilterPeriod,
    newWallets: string[],
    newDefaultWallet: string,
    newDeficitThreshold: number
  ) => void;
  onShowOnboarding: () => void;
  onOpenBulkAdd: () => void;
  onExportAllData: () => void;
  onImportData: (file: File) => void;
  onClearAllData: () => void;
  trackingConsent: boolean | null;
  onTrackingConsentChange: (consent: boolean) => void;
  onAlert: (title: string, message: string) => void;
}

const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentDefault,
  currentDefaultWallet,
  wallets,
  currentDeficitThreshold,
  onSave,
  onShowOnboarding,
  onOpenBulkAdd,
  onExportAllData,
  onImportData,
  onClearAllData,
  trackingConsent,
  onTrackingConsentChange,
  onAlert,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>(currentDefault);
  const [selectedWallet, setSelectedWallet] = useState<string>(currentDefaultWallet);
  const [editableWallets, setEditableWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState('');
  const [deficitThreshold, setDeficitThreshold] = useState<string>(currentDeficitThreshold.toString());
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPeriod(currentDefault);
      setSelectedWallet(currentDefaultWallet);
      setEditableWallets(wallets);
      setDeficitThreshold(currentDeficitThreshold.toString());
      setNewWallet('');
    }
  }, [isOpen, currentDefault, currentDefaultWallet, wallets, currentDeficitThreshold]);

  const handleSave = () => {
    // Fallback to 'all' if the selected default wallet was deleted during this session
    const finalSelectedWallet = (selectedWallet === 'all' || editableWallets.includes(selectedWallet))
      ? selectedWallet
      : 'all';

    const finalThreshold = parseFloat(deficitThreshold);
    const validThreshold = isNaN(finalThreshold) ? 0 : Math.abs(finalThreshold);

    onSave(selectedPeriod, editableWallets, finalSelectedWallet, validThreshold);
  };

  const handleAddWallet = () => {
    if (newWallet.trim() && !editableWallets.includes(newWallet.trim())) {
      trackUserAction('add_wallet');
      setEditableWallets([...editableWallets, newWallet.trim()]);
      setNewWallet('');
    }
  };

  const handleDeleteWallet = (walletToDelete: string) => {
    if (editableWallets.length > 1) {
        trackUserAction('delete_wallet');
        setEditableWallets(editableWallets.filter(w => w !== walletToDelete));
    } else {
        onAlert("Action Not Allowed", "You must have at least one wallet.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      trackUserAction('import_file_selected');
      onImportData(file);
    }
    // Reset file input value to allow re-uploading the same file
    if(event.target) {
      event.target.value = '';
    }
  };

  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  const selectClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Save Settings
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings / அமைப்புகள்" footer={footer}>
      <div className="space-y-6">
        <div>
          <label className={labelClasses}>
            Theme / தீம்
          </label>
           <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-700 p-2">
            <span className="px-2 font-medium text-slate-900 dark:text-slate-100 capitalize">
              {theme} Mode
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Switch between light and dark mode.
          </p>
        </div>

        <div>
          <label htmlFor="default-filter" className={labelClasses}>
            Default Time Filter / இயல்புநிலை வடிகட்டி
          </label>
          <div className="mt-2">
            <select
              id="default-filter"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as FilterPeriod)}
              className={selectClasses}
            >
              <option value={FilterPeriod.ALL}>All Time / அனைத்தும்</option>
              <option value={FilterPeriod.TODAY}>Today / இன்று</option>
              <option value={FilterPeriod.THIS_MONTH}>This Month / இந்த மாதம்</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            This will be the default view when you open the app.
          </p>
        </div>

        <div>
          <label htmlFor="default-wallet-filter" className={labelClasses}>
            Default Wallet Filter / இயல்புநிலை கணக்கு
          </label>
          <div className="mt-2">
            <select
              id="default-wallet-filter"
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className={selectClasses}
            >
              <option value="all">All Wallets / அனைத்தும்</option>
              {editableWallets.map(wallet => (
                <option key={wallet} value={wallet}>{wallet}</option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            This wallet will be selected when you open the app.
          </p>
        </div>

        <div>
            <label className={labelClasses}>Financial Health / நிதி ஆரோக்கியம்</label>
            <label htmlFor="deficit-threshold" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                Critical Deficit Threshold / அதிகபட்ச பற்றாக்குறை வரம்பு
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-500 sm:text-sm">₹</span>
                </div>
                <input
                    type="number"
                    id="deficit-threshold"
                    value={deficitThreshold}
                    onChange={(e) => setDeficitThreshold(e.target.value)}
                    className={`${inputBaseClasses} pl-7`}
                    placeholder="1000"
                />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Deficits below this amount will be shown as Warnings (Yellow). Larger deficits become Critical (Red).
            </p>
        </div>

        <div>
            <label className={labelClasses}>Manage Wallets / கணக்குகளை நிர்வகி</label>
             <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Add or remove wallets (e.g., Cash, Bank).
            </p>
            <div className="mt-2 space-y-2">
                {editableWallets.map(wallet => (
                    <div key={wallet} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                        <span className="text-slate-800 dark:text-slate-100">{wallet}</span>
                        <button onClick={() => handleDeleteWallet(wallet)} className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex gap-2">
                <input
                    type="text"
                    value={newWallet}
                    onChange={(e) => setNewWallet(e.target.value)}
                    placeholder="Add new wallet name"
                    className={inputBaseClasses}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWallet()}
                />
                <button
                    type="button"
                    onClick={handleAddWallet}
                    className="btn-press py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Add
                </button>
            </div>
        </div>

        <div>
            <label className={labelClasses}>Data & Help</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".zip" className="hidden" />
                <button
                    type="button"
                    onClick={handleImportClick}
                    className="btn-press text-left flex items-center gap-3 justify-center py-2.5 px-4 border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3v11.25" />
                    </svg>
                    Import
                </button>
                <button
                    type="button"
                    onClick={() => { onClose(); onExportAllData(); }}
                    className="btn-press text-left flex items-center gap-3 justify-center py-2.5 px-4 border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All
                </button>
                <button
                    type="button"
                    onClick={() => { onClose(); onOpenBulkAdd(); }}
                    className="btn-press text-left flex items-center gap-3 justify-center py-2.5 px-4 border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Bulk Add
                </button>
                <button
                    type="button"
                    onClick={() => { onClose(); onShowOnboarding(); }}
                    className="btn-press text-left flex items-center gap-3 justify-center py-2.5 px-4 border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Show Tutorial
                </button>
            </div>
             <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Backup or restore your data, or use helpful tools.
            </p>
        </div>
        
        <div>
            <label className={labelClasses}>Danger Zone</label>
             <button
                type="button"
                onClick={() => { onClose(); onClearAllData(); }}
                className="btn-press mt-2 w-full text-left flex items-center gap-3 justify-center py-2.5 px-4 border border-red-500 text-red-600 dark:text-red-400 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All Data / அனைத்தையும் அழி
            </button>
             <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Permanently delete all data from this device.
            </p>
        </div>

        <div>
            <label className={labelClasses}>Privacy Settings / தனியுரிமை</label>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Help us improve by allowing anonymous usage tracking. We will never collect your financial data.
            </p>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-700 p-2">
                <span className="px-2 font-medium text-slate-900 dark:text-slate-100">
                    Allow Anonymous Tracking
                </span>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                        type="checkbox"
                        checked={!!trackingConsent}
                        onChange={(e) => onTrackingConsentChange(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;