import React from 'react';
import type { FC } from 'react';

interface InstallAppBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallAppBanner: FC<InstallAppBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-slideUp"
      role="note"
      aria-label="Install App"
    >
      <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Install App / நிறுவு
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Get quick access — works offline, feels native.
            </p>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={onInstall}
              className="btn-press py-1.5 px-4 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Install
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Dismiss install banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallAppBanner;
