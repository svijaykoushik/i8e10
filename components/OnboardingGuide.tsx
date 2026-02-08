import React, { useState } from 'react';
import type { FC } from 'react';

interface OnboardingGuideProps {
  onComplete: () => void;
  isRerunnable?: boolean;
}

const steps = [
  {
    title: 'Welcome! / நல்வரவு!',
    description: 'This is your private, offline-first personal finance tracker. Let\'s quickly see how it works.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M12 6h.01M6 12h.01M18 12h.01M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
      </svg>
    ),
  },
  {
    title: 'Quick Add / விரைவாகச் சேர்',
    description: 'The `+` button is smart! A quick tap adds an item to your current view (e.g. an Expense). Press and hold the button to see all options.',
    icon: (
        <div className="relative w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
            </svg>
             <svg xmlns="http://www.w3.org/2000/svg" className="absolute -top-2 -right-6 h-12 w-12 text-indigo-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 9.75L17.5 7.5l-.75 2.25a3 3 0 00-2 2L12.5 15l2.25-.75a3 3 0 002-2L17.5 10l.75-2.25z" /></svg>
        </div>
    ),
  },
  {
    title: 'Organize Your Finances / நிதியை ஒழுங்கமைக்கவும்',
    description: 'Switch between Transactions (பரிவர்த்தனைகள்), Debts (கடன்கள்), and Investments (முதலீடுகள்) using the tabs at the top.',
    icon: (
        <div className="flex space-x-1 rounded-xl bg-blue-900/10 dark:bg-blue-900/20 p-1">
            <span className="w-24 text-center py-2.5 text-sm font-semibold leading-5 rounded-lg bg-white dark:bg-slate-700/80 shadow text-indigo-700 dark:text-slate-100">Transactions</span>
            <span className="w-24 text-center py-2.5 text-sm font-semibold leading-5 rounded-lg text-slate-600 dark:text-slate-300">Debts</span>
            <span className="w-24 text-center py-2.5 text-sm font-semibold leading-5 rounded-lg text-slate-600 dark:text-slate-300">Investments</span>
        </div>
    ),
  },
  {
    title: 'The Best Place to Start / தொடங்குவதற்கான சிறந்த வழி',
    description: "Use the 'Reconcile' button to enter your current cash or bank balance. The app will create an adjustment to get you started instantly!",
    icon: (
        <div className="p-3 rounded-full text-blue-600 dark:text-blue-400 bg-blue-200/50 dark:bg-blue-800/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3-1M6 7l-2 5h4l-2-5zm15-1l-3 1m0 0l3 9a5.002 5.002 0 01-6.001 0M18 7l-3-1M18 7l2 5h-4l2-5zm-5 5h2" />
          </svg>
        </div>
    ),
  },
];


const OnboardingGuide: FC<OnboardingGuideProps> = ({ onComplete, isRerunnable = false }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const handleFinish = () => onComplete();

  const currentStepData = steps[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-out animate-fadeInUp"
    >
      <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm" aria-hidden="true" onClick={handleFinish} />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 ease-out flex flex-col overflow-hidden">
        <div className="p-6 sm:p-8 flex-grow flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 flex items-center justify-center mb-6">
                 {currentStepData.icon}
            </div>
          <div key={currentStep} className="animate-slide-in-right">
            <h2 id="onboarding-title" className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {currentStepData.title}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
                {currentStepData.description}
            </p>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`block w-2.5 h-2.5 rounded-full transition-colors ${currentStep === index ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 0 ? (
                <button
                  onClick={handlePrev}
                  className="btn-press text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                  Back
                </button>
              ) : (
                 <button
                  onClick={handleFinish}
                  className="btn-press text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                  {isRerunnable ? 'Close' : 'Skip'}
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Get Started! / தொடங்குக!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;