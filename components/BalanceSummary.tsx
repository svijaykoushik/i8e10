

import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { FilterPeriod } from '../types';

interface BalanceSummaryProps {
  currentBalance: number;
  projectedBalance: number;
  periodicIncome: number;
  periodicExpense: number;
  projectedPeriodicIncome: number;
  projectedPeriodicExpense: number;
  onReconcileClick: () => void;
  filterPeriod: FilterPeriod;
  walletName: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const AnimatedNumber: FC<{ value: number; className: string; }> = ({ value, className }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;
        const duration = 500; // ms
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const easedPercentage = 1 - Math.pow(1 - percentage, 3); // easeOutCubic
            const currentValue = startValue + (endValue - startValue) * easedPercentage;
            
            setDisplayValue(currentValue);

            if (progress < duration) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(endValue);
                prevValueRef.current = endValue;
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            prevValueRef.current = value;
        };
    }, [value]);

    return <p className={className}>{formatCurrency(displayValue)}</p>;
};

const getTitleForPeriod = (period: FilterPeriod) => {
    switch (period) {
      case FilterPeriod.TODAY: return { main: "Today's Net Flow / இன்றைய நிகர ஓட்டம்", sub: 'Today' };
      case FilterPeriod.THIS_MONTH: return { main: "This Month's Net Flow / மாத நிகர ஓட்டம்", sub: 'This Month' };
      case FilterPeriod.LAST_MONTH: return { main: 'Last Month Net Flow / கடந்த மாத நிகர ஓட்டம்', sub: 'Last Month' };
      case FilterPeriod.CUSTOM: return { main: 'Net Flow in Range / குறிப்பிட்ட தேதியில்', sub: 'in Range' };
      case FilterPeriod.ALL: return { main: 'Overall Net Flow / ஒட்டுமொத்த நிகர ஓட்டம்', sub: 'All Time' };
      default: return { main: 'Periodic Net Flow', sub: 'Period' };
    }
};

const BalanceSummary: FC<BalanceSummaryProps> = ({ 
  currentBalance,
  projectedBalance,
  periodicIncome, 
  periodicExpense, 
  projectedPeriodicIncome,
  projectedPeriodicExpense,
  onReconcileClick, 
  filterPeriod,
  walletName,
}) => {
  const { main: flowTitle, sub: subTitle } = getTitleForPeriod(filterPeriod);
  const periodicFlow = periodicIncome - periodicExpense;
  const projectedPeriodicFlow = projectedPeriodicIncome - projectedPeriodicExpense;
  const isReconcileDisabled = walletName === 'All Wallets';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Total Balance Card - This is the HERO component */}
      <div className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Total Balance / மொத்த இருப்பு</h3>
          <AnimatedNumber 
            value={currentBalance} 
            className="text-5xl font-bold text-slate-800 dark:text-slate-100 mt-1" 
          />
          {projectedBalance !== currentBalance && (
            <p className="text-md text-slate-500 dark:text-slate-400 mt-2 animate-fadeInUp">
              Projected: {formatCurrency(projectedBalance)}
            </p>
          )}
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">In: {walletName}</p>
        </div>
        <button
          onClick={onReconcileClick}
          disabled={isReconcileDisabled}
          className="btn-press mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
          aria-label="Reconcile balance"
          title={isReconcileDisabled ? "Select a specific wallet to reconcile its balance" : `Adjust balance for ${walletName} to match reality`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3-1M6 7l-2 5h4l-2-5zm15-1l-3 1m0 0l3 9a5.002 5.002 0 01-6.001 0M18 7l-3-1M18 7l2 5h-4l2-5zm-5 5h2" />
          </svg>
          Reconcile
        </button>
      </div>
      
      {/* Periodic Flow Card - This is informational */}
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">{flowTitle}</h3>
            <AnimatedNumber 
                value={periodicFlow} 
                className={`text-4xl font-bold mt-1 ${periodicFlow >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-orange-500 dark:text-orange-400'}`} 
            />
            {projectedPeriodicFlow !== periodicFlow && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 animate-fadeInUp">
                  Projected: {formatCurrency(projectedPeriodicFlow)}
              </p>
            )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div>
                <h4 className="text-sm text-slate-500 dark:text-slate-400">Income ({subTitle}) / வரவு</h4>
                <AnimatedNumber value={periodicIncome} className="text-lg font-semibold text-green-600 dark:text-green-400" />
                {projectedPeriodicIncome !== periodicIncome && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                      Total: {formatCurrency(projectedPeriodicIncome)}
                  </p>
                )}
            </div>
            <div>
                <h4 className="text-sm text-slate-500 dark:text-slate-400">Expense ({subTitle}) / செலவு</h4>
                <AnimatedNumber value={periodicExpense} className="text-lg font-semibold text-red-600 dark:text-red-400" />
                {projectedPeriodicExpense !== periodicExpense && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                      Total: {formatCurrency(projectedPeriodicExpense)}
                  </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSummary;