import React from 'react';
import type { FC } from 'react';

interface TrackingConsentBannerProps {
  onAllow: () => void;
  onDecline: () => void;
}

const TrackingConsentBanner: FC<TrackingConsentBannerProps> = ({ onAllow, onDecline }) => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white p-4 shadow-2xl z-50 animate-fadeInUp"
      role="dialog"
      aria-labelledby="tracking-consent-title"
      aria-describedby="tracking-consent-description"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 id="tracking-consent-title" className="font-semibold">Can we collect anonymous usage data? / அநாமதேய பயன்பாட்டுத் தரவை நாங்கள் சேகரிக்கலாமா?</h2>
          <p id="tracking-consent-description" className="text-sm text-slate-300 mt-1">
            This helps us understand which features are most popular so we can improve the app. We will never collect any of your financial data.
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-3">
          <button
            onClick={onDecline}
            className="btn-press py-2 px-4 text-sm font-medium rounded-md bg-slate-600 hover:bg-slate-500 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAllow}
            className="btn-press py-2 px-4 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackingConsentBanner;