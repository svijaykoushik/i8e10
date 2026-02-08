import { CashFlowFilterState, FilterPeriod } from "@/types";
import { FC } from "react";

interface CashFlowFilterControlsProps {
  filter: CashFlowFilterState;
  onOpenModal: () => void;
  onResetFilter: (key: keyof CashFlowFilterState) => void;
}

const FilterPill: FC<{ label: string; onDismiss: () => void }> = ({
  label,
  onDismiss,
}) => (
  <div className="flex items-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-sm font-semibold px-3 py-1 rounded-full animate-fadeInUp">
    <span>{label}</span>
    <button
      onClick={onDismiss}
      className="ml-2 -mr-1 p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      aria-label={`Remove ${label} filter`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
);

const getPeriodLabel = (period: FilterPeriod): string => {
  switch (period) {
    case FilterPeriod.ALL:
      return "All Time";
    case FilterPeriod.TODAY:
      return "Today";
    case FilterPeriod.THIS_MONTH:
      return "This Month";
    case FilterPeriod.LAST_MONTH:
      return "Last Month";
    case FilterPeriod.CUSTOM:
      return "Custom Range";
    default:
      return "";
  }
};

const CashFlowFilterControls: FC<CashFlowFilterControlsProps> = ({
  filter,
  onOpenModal,
  onResetFilter,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm mb-6 flex items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 flex-grow">
        {filter.period !== FilterPeriod.ALL &&
          getPeriodLabel(filter.period) && (
            <FilterPill
              label={getPeriodLabel(filter.period)}
              onDismiss={() => onResetFilter("period")}
            />
          )}
      </div>
      <button
        onClick={onOpenModal}
        className="btn-press flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        aria-label="Open investment filters"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </button>
    </div>
  );
};

export default CashFlowFilterControls;
