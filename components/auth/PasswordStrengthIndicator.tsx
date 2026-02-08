import React from 'react';
import type { FC } from 'react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

interface Strength {
  score: number; // 0-4
  label: string;
  color: string;
}

const calculateStrength = (password: string): Strength => {
  let score = 0;
  if (!password || password.length < 6) return { score: 0, label: 'Too Short', color: 'bg-slate-300' };

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  switch (score) {
    case 1: return { score, label: 'Weak', color: 'bg-red-500' };
    case 2: return { score, label: 'Okay', color: 'bg-yellow-500' };
    case 3: return { score, label: 'Good', color: 'bg-sky-500' };
    case 4: return { score, label: 'Strong', color: 'bg-green-500' };
    default: return { score: 0, label: 'Weak', color: 'bg-red-500' };
  }
};

const PasswordStrengthIndicator: FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const { score, label, color } = calculateStrength(password);
  
  if (!password) {
    return null;
  }

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex justify-between items-center">
         <p className={`text-xs font-semibold ${score > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500'}`}>{label}</p>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${(score / 4) * 100}%` }}
        />
      </div>
    </div>
  );
};

// Expose the calculation function for use in other components
PasswordStrengthIndicator.calculateStrength = calculateStrength;

export default PasswordStrengthIndicator;
