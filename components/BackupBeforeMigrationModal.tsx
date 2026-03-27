import React, { FC } from 'react';
import Modal from './ui/Modal';

interface BackupBeforeMigrationModalProps {
  isOpen: boolean;
  onConfirmBackupDone: () => void;
  onCancel: () => void;
  onExport: () => void;
}

const BackupBeforeMigrationModal: FC<BackupBeforeMigrationModalProps> = ({
  isOpen,
  onConfirmBackupDone,
  onCancel,
  onExport,
}) => {
  const footer = (
    <>
      <button
        onClick={onCancel}
        className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Cancel Migration
      </button>
      <button
        onClick={onConfirmBackupDone}
        className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        I've Completed Backup
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Important: Backup Required" footer={footer}>
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Critical Update Coming
          </p>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            We're upgrading your financial data structure to use a more secure, 
            accountant-grade double-entry accounting system. This is an irreversible change.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            Before you proceed, ensure you have a backup:
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="auto-backup"
                className="mt-1 rounded border-slate-300"
                disabled
                defaultChecked
              />
              <label htmlFor="auto-backup" className="text-sm text-slate-700 dark:text-slate-300">
                <strong>Export all data</strong> via Settings → Export (recommended)
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="encrypted-backup"
                className="mt-1 rounded border-slate-300"
                disabled
              />
              <label htmlFor="encrypted-backup" className="text-sm text-slate-700 dark:text-slate-300">
                Keep your <strong>12-word recovery phrase</strong> secure (unchanged)
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="browser-backup"
                className="mt-1 rounded border-slate-300"
                disabled
              />
              <label htmlFor="browser-backup" className="text-sm text-slate-700 dark:text-slate-300">
                (Optional) Use your browser's built-in backup before updating
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
            What's Changing:
          </p>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <li>✓ More accurate balance tracking</li>
            <li>✓ Professional accounting reports (future)</li>
            <li>✓ Better handling of complex transactions</li>
            <li>✓ Same encryption & privacy</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Ready?</strong> Click the "Export" button below to save your data, 
            then come back and click "I've Completed Backup" to proceed with the upgrade.
          </p>
        </div>

        <button
          onClick={onExport}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          📥 Export Data Now
        </button>
      </div>
    </Modal>
  );
};

export default BackupBeforeMigrationModal;
