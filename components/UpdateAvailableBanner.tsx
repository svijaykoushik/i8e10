import React from 'react';
import type { FC } from 'react';

interface UpdateAvailableBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateAvailableBanner: FC<UpdateAvailableBannerProps> = ({ onUpdate, onDismiss }) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-slideUp"
      role="alert"
      aria-label="Update Available"
    >
      <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-amber-300 dark:border-amber-500/40 p-4">
        <div className="flex items-center gap-4">
          {/* Icon — arrow-path / refresh */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Update Available / புதுப்பிப்பு
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              A new version is ready — tap to update.
            </p>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={onUpdate}
              className="btn-press py-1.5 px-4 text-sm font-medium rounded-lg text-white bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Dismiss update banner"
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

export default UpdateAvailableBanner;
