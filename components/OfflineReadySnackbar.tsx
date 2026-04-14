import React from 'react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface OfflineReadySnackbarProps {
  show: boolean;
  onDismiss: () => void;
}

const OfflineReadySnackbar: FC<OfflineReadySnackbarProps> = ({ show, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for transition out
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onDismiss]);

  if (!show && !isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-emerald-300 dark:border-emerald-500/40 p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Ready for Offline / ஆஃப்லைனில் தயார்
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              App can now be used without internet. / இணையம் இல்லாமலேயே செயலியைப் பயன்படுத்தலாம்.
            </p>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Dismiss offline ready snackbar"
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

export default OfflineReadySnackbar;
