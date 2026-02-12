
import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';

interface DebtSummaryProps {
  totalLent: number;
  totalOwed: number;
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


const DebtSummary: FC<DebtSummaryProps> = ({ totalLent, totalOwed }) => {
  const netPosition = totalLent - totalOwed;
  const netPositionColor = netPosition >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-orange-500 dark:text-orange-400';
  const netPositionLabel = netPosition >= 0 ? 'Net Receivable' : 'Net Payable';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Net Debt Position Card - HERO */}
      <div className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Net Debt Position / நிகர கடன் நிலை</h3>
          <AnimatedNumber 
            value={netPosition} 
            className={`text-5xl font-bold mt-1 ${netPositionColor}`}
          />
          <p className="text-md text-slate-500 dark:text-slate-400 mt-2 animate-fadeInUp">
            {netPositionLabel}
          </p>
        </div>
      </div>
      
      {/* Debt Overview Card - Informational */}
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Debt Overview / கடன் கண்ணோட்டம்</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div>
                <h4 className="text-sm text-slate-500 dark:text-slate-400">Money You Lent / கொடுத்த கடன்</h4>
                <AnimatedNumber value={totalLent} className="text-lg font-semibold text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <h4 className="text-sm text-slate-500 dark:text-slate-400">Money You Owe / வாங்கிய கடன்</h4>
                <AnimatedNumber value={totalOwed} className="text-lg font-semibold text-orange-600 dark:text-orange-400" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default DebtSummary;