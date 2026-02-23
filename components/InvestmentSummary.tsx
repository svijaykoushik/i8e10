
import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';

interface InvestmentSummaryProps {
  totalInvested: number;
  currentPortfolioValue: number;
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

const InvestmentSummary: FC<InvestmentSummaryProps> = ({ totalInvested, currentPortfolioValue }) => {
  const totalGainLoss = currentPortfolioValue - totalInvested;
  const gainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const gainLossColor = totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const gainLossSign = totalGainLoss >= 0 ? '▲' : '▼';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Portfolio Value Card - HERO */}
      <div className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Portfolio Value / முதலீடுகளின் மதிப்பு</h3>
          <AnimatedNumber 
            value={currentPortfolioValue} 
            className="text-5xl font-bold text-slate-800 dark:text-slate-100 mt-1" 
          />
        </div>
      </div>
      
      {/* Investment Performance Card - Informational */}
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Investment Performance / முதலீட்டு செயல்திறன்</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div>
                <h4 className="text-sm text-slate-500 dark:text-slate-400">Total Invested / மொத்த முதலீடு</h4>
                <AnimatedNumber value={totalInvested} className="text-lg font-semibold text-slate-700 dark:text-slate-300" />
            </div>
            <div>
                <h4 className="text-sm text-slate-500 dark:text-slate-400">Total Gain/Loss / மொத்த லாபம்/நஷ்டம்</h4>
                <AnimatedNumber value={totalGainLoss} className={`text-lg font-semibold ${gainLossColor}`} />
                {totalInvested > 0 && (
                    <p className={`text-xs font-semibold ${gainLossColor}`}>
                        {gainLossSign} {gainLossPercent.toFixed(2)}%
                    </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummary;