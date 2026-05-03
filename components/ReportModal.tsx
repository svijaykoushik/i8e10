import React, { useState } from 'react';
import type { FC } from 'react';
import { FilterPeriod, Transaction } from '../types';
import Modal from './ui/Modal';
import { generateIncomeStatementPDF } from '../utils/pdfGenerator';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

const ReportModal: FC<ReportModalProps> = ({ isOpen, onClose, transactions }) => {
  const [period, setPeriod] = useState<FilterPeriod>(FilterPeriod.YTD);

  const handleGenerate = async () => {
    // Filter transactions based on period
    // Since period filtering logic is in App.tsx (or we can just reuse a simple version here)
    // Actually, App.tsx has the filtering logic. But wait, we need to pass the selected period to pdfGenerator.
    // Instead of duplicating filter logic, we can either:
    // 1. Let App pass a filter function or the filtered transactions.
    // 2. Just duplicate the simple period filtering here. Let's pass the FilterPeriod to App via a callback, 
    //    or duplicate simple filtering. We'll implement simple filtering here for simplicity.

    const today = new Date();
    let start = new Date(0);
    let end = new Date();

    switch (period) {
      case FilterPeriod.TODAY:
        start = new Date(today);
        start.setHours(0, 0, 0, 0);
        end = new Date(today);
        break;
      case FilterPeriod.THIS_MONTH:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case FilterPeriod.LAST_MONTH:
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case FilterPeriod.LAST_3_MONTHS:
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        end = new Date(today);
        break;
      case FilterPeriod.YTD:
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today);
        break;
      case FilterPeriod.ALL:
      default:
        // already set
        break;
    }

    if (period === FilterPeriod.ALL && transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.date).getTime());
      start = new Date(Math.min(...dates));
    }

    const filtered = period === FilterPeriod.ALL ? transactions : transactions.filter(tx => {
        const d = new Date(tx.date + 'T00:00:00');
        return d >= start && d <= end;
    });

    await generateIncomeStatementPDF(filtered, start, end);
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <button type="button" onClick={onClose} className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
      <button type="button" onClick={handleGenerate} className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Generate PDF</button>
    </div>
  );

  const inputClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Income Statement" footer={footer}>
      <div className="space-y-4">
        <div>
            <label htmlFor="report-period" className={labelClasses}>Time Period</label>
            <select
              id="report-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as FilterPeriod)}
              className={inputClasses}
            >
              <option value={FilterPeriod.ALL}>All Time</option>
              <option value={FilterPeriod.TODAY}>Today</option>
              <option value={FilterPeriod.THIS_MONTH}>This Month</option>
              <option value={FilterPeriod.LAST_MONTH}>Last Month</option>
              <option value={FilterPeriod.LAST_3_MONTHS}>Last 3 Months</option>
              <option value={FilterPeriod.YTD}>Year to Date</option>
            </select>
        </div>
      </div>
    </Modal>
  );
};

export default ReportModal;
