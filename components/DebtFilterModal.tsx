import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { DebtFilterState, DebtFilterStatus, DebtFilterType, FilterPeriod } from '../types';
import Modal from './ui/Modal';


interface DebtFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newFilter: DebtFilterState) => void;
  onExport: () => void;
  initialFilter: DebtFilterState;
}

const getLocalDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DebtFilterModal: FC<DebtFilterModalProps> = ({ isOpen, onClose, onApply, onExport, initialFilter }) => {
  const [modalFilter, setModalFilter] = useState<DebtFilterState>(initialFilter);

  useEffect(() => {
    if (isOpen) {
      setModalFilter(initialFilter);
    }
  }, [isOpen, initialFilter]);

  const handleFilterChange = <K extends keyof DebtFilterState>(key: K, value: DebtFilterState[K]) => {
    setModalFilter(prev => ({ ...prev, [key]: value }));
  };
  
  const handleReset = () => {
    const resetState: DebtFilterState = {
        status: DebtFilterStatus.ALL,
        type: DebtFilterType.ALL,
        period: FilterPeriod.THIS_MONTH,
        startDate: getLocalDateString(),
        endDate: getLocalDateString(),
    };
    setModalFilter(resetState);
  };

  const handleApply = () => {
    onApply(modalFilter);
  };
  
  const inputClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";

  const footer = (
    <div className="flex justify-between items-center w-full">
        <div>
            <button type="button" onClick={onExport} className="btn-press flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                Export CSV
            </button>
        </div>
        <div className="flex items-center gap-3">
             <button type="button" onClick={handleReset} className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Reset</button>
            <button type="button" onClick={handleApply} className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Apply Filters</button>
        </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Debts" footer={footer}>
      <div className="space-y-4">
        <div>
            <label htmlFor="filter-period" className={labelClasses}>Time Period / காலம்</label>
            <select
              id="filter-period"
              value={modalFilter.period}
              onChange={(e) => handleFilterChange('period', e.target.value as FilterPeriod)}
              className={inputClasses}
            >
              <option value={FilterPeriod.ALL}>All Time / அனைத்தும்</option>
              <option value={FilterPeriod.TODAY}>Today / இன்று</option>
              <option value={FilterPeriod.THIS_MONTH}>This Month / இந்த மாதம்</option>
              <option value={FilterPeriod.LAST_MONTH}>Last Month / கடந்த மாதம்</option>
              <option value={FilterPeriod.CUSTOM}>Custom Range / குறிப்பிட்ட தேதி</option>
            </select>
        </div>
        {modalFilter.period === FilterPeriod.CUSTOM && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeInUp">
            <div>
                <label htmlFor="start-date" className={labelClasses}>Start Date</label>
                <input
                type="date"
                id="start-date"
                value={modalFilter.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={inputClasses}
                />
            </div>
            <div>
                <label htmlFor="end-date" className={labelClasses}>End Date</label>
                <input
                type="date"
                id="end-date"
                value={modalFilter.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={inputClasses}
                />
            </div>
          </div>
        )}
        <div>
            <label htmlFor="filter-debt-status" className={labelClasses}>Status / நிலை</label>
            <select
              id="filter-debt-status"
              value={modalFilter.status}
              onChange={(e) => handleFilterChange('status', e.target.value as DebtFilterStatus)}
              className={inputClasses}
            >
              <option value={DebtFilterStatus.ALL}>All / அனைத்தும்</option>
              <option value={DebtFilterStatus.OUTSTANDING}>Outstanding / நிலுவையில்</option>
              <option value={DebtFilterStatus.SETTLED}>Settled / தீர்ந்தது</option>
            </select>
        </div>
        <div>
            <label htmlFor="filter-debt-type" className={labelClasses}>Type / வகை</label>
            <select
                id="filter-debt-type"
                value={modalFilter.type}
                onChange={(e) => handleFilterChange('type', e.target.value as DebtFilterType)}
                className={inputClasses}
            >
                <option value={DebtFilterType.ALL}>All / அனைத்தும்</option>
                <option value={DebtFilterType.LENT}>Lent / கொடுத்தது</option>
                <option value={DebtFilterType.OWED}>Owed / வாங்கியது</option>
            </select>
        </div>
      </div>
    </Modal>
  );
};

export default DebtFilterModal;