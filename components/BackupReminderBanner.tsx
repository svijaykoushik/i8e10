import React from 'react';
import type { FC } from 'react';

interface BackupReminderBannerProps {
  daysSinceLastBackup: number | null;
  onBackup: () => void;
  onDismiss: () => void;
}

const BackupReminderBanner: FC<BackupReminderBannerProps> = ({ daysSinceLastBackup, onBackup, onDismiss }) => {
    
  const isInitialBackup = daysSinceLastBackup === null;
  const message = isInitialBackup
    ? "To protect against data loss from browser cache clearing or a forgotten password, it's highly recommended to perform an initial backup."
    : `Your last backup was ${daysSinceLastBackup} days ago. Regular backups are essential to prevent data loss.`;

  return (
    <div
      className="bg-amber-100 dark:bg-amber-900/50 border-b-2 border-amber-300 dark:border-amber-700 p-4 animate-fadeInUp"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-amber-500 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="text-amber-800 dark:text-amber-200 text-sm">
                <p className="font-bold">Important: Protect Your Data / முக்கியமானது: உங்கள் தரவைப் பாதுகாக்கவும்</p>
                <p>{message}</p>
            </div>
        </div>
        <div className="flex-shrink-0 flex gap-3 mt-3 sm:mt-0">
          <button
            onClick={onDismiss}
            className="btn-press py-2 px-4 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-amber-200/50 dark:bg-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
          >
            Remind Me Later
          </button>
          <button
            onClick={onBackup}
            className="btn-press py-2 px-4 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Backup Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupReminderBanner;
