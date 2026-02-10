import React, { useState, useEffect } from "react";
import type { FC } from "react";
import {
  CashFlowFilterState,
  FilterPeriod,
} from "../types";
import Modal from "./ui/Modal";

interface CashFlowFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newFilter: CashFlowFilterState) => void;
  initialFilter: CashFlowFilterState;
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const CashFlowFilterModal: FC<CashFlowFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilter,
}) => {
  const [modalFilter, setModalFilter] =
    useState<CashFlowFilterState>(initialFilter);

  useEffect(() => {
    if (isOpen) {
      setModalFilter(initialFilter);
    }
  }, [isOpen, initialFilter]);

  const handleFilterChange = <K extends keyof CashFlowFilterState>(
    key: K,
    value: CashFlowFilterState[K]
  ) => {
    setModalFilter((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const resetState: CashFlowFilterState = {
      period: FilterPeriod.ALL,
      startDate: getLocalDateString(),
      endDate: getLocalDateString(),
    };
    setModalFilter(resetState);
  };

  const handleApply = () => {
    onApply(modalFilter);
  };

  const inputClasses =
    "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses =
    "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";

  const footer = (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Investments"
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="filter-period" className={labelClasses}>
            Time Period / காலம்
          </label>
          <select
            id="filter-period"
            value={modalFilter.period}
            onChange={(e) =>
              handleFilterChange("period", e.target.value as FilterPeriod)
            }
            className={inputClasses}
          >
            <option value={FilterPeriod.ALL}>All Time / அனைத்தும்</option>
            <option value={FilterPeriod.TODAY}>Today / இன்று</option>
            <option value={FilterPeriod.THIS_MONTH}>
              This Month / இந்த மாதம்
            </option>
            <option value={FilterPeriod.LAST_MONTH}>
              Last Month / கடந்த மாதம்
            </option>
            <option value={FilterPeriod.CUSTOM}>
              Custom Range / குறிப்பிட்ட தேதி
            </option>
          </select>
        </div>

        {modalFilter.period === FilterPeriod.CUSTOM && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeInUp">
            <div>
              <label htmlFor="start-date" className={labelClasses}>
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={modalFilter.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="end-date" className={labelClasses}>
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={modalFilter.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CashFlowFilterModal;
