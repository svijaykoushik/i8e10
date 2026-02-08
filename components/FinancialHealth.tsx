import type { FC } from "react";
import CashFlowFilterControls from "./CashFlowFilterControls";
import { CashFlowFilterState, FilterPeriod } from "@/types";

interface FinancialHealthProps {
  cash: number;
  investments: number;
  debt: number;
  moneyLent: number;
  income: number;
  expense: number;
  cashFlowFilter: CashFlowFilterState;
  onOpenModal: () => void;
  onResetFilter: (key: keyof CashFlowFilterState) => void;
  deficitThreshold?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const FinancialHealth: FC<FinancialHealthProps> = ({
  cash,
  investments,
  debt,
  moneyLent,
  income,
  expense,
  cashFlowFilter,
  onOpenModal,
  onResetFilter,
  deficitThreshold = 0,
}) => {
  // --- 1. Data Normalization (Fixing Negative Assets) ---
  // If cash is negative, it is not an asset; it is a liability (overdraft).
  const effectiveCashAsset = Math.max(0, cash);
  const effectiveCashLiability = cash < 0 ? Math.abs(cash) : 0;

  const totalAssets = effectiveCashAsset + investments + moneyLent;
  const totalLiabilities = debt + effectiveCashLiability;
  const netWorth = totalAssets - totalLiabilities;

  // --- 2. Metrics Calculation ---
  const netFlow = income - expense;

  let debtToAssetRatio = 0;
  if (totalAssets > 0) {
    debtToAssetRatio = (totalLiabilities / totalAssets) * 100;
  } else if (totalLiabilities > 0) {
    debtToAssetRatio = 100; // All debt, no assets
  }

  // --- 3. Stoplight Score Logic ---
  let healthStatus: "healthy" | "warning" | "critical" = "healthy";
  let healthLabel = "Healthy / ஆரோக்கியம்";
  let healthMessage = "Your finances are stable.";
  let healthColor = "text-emerald-700 dark:text-emerald-400";
  let healthBg = "bg-emerald-100 dark:bg-emerald-900/30";
  let healthBorder = "border-emerald-200 dark:border-emerald-800";
  let HealthIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  // Threshold logic for deficits
  // deficitThreshold should be positive number. e.g. 1000.
  // Critical if netFlow < -1000.
  // Warning if netFlow < 0 but >= -1000.

  // IGNORE trivial liabilities (e.g. < 500) for the Debt Ratio Score to prevent alert fatigue on small overdrafts.
  const isSignificantLiability = totalLiabilities > 500;

  if (netFlow < -Math.abs(deficitThreshold)) {
    // CRITICAL: Spending WAY more than earning (exceeds threshold)
    healthStatus = "critical";
    healthLabel = "Critical / நெருக்கடி";
    healthMessage =
      "Significant Negative Cash Flow. You are spending much more than you earn.";
    healthColor = "text-rose-700 dark:text-rose-400";
    healthBg = "bg-rose-100 dark:bg-rose-900/30";
    healthBorder = "border-rose-200 dark:border-rose-800";
    HealthIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  } else if (debtToAssetRatio > 50 && isSignificantLiability) {
    // CRITICAL: High Debt (Only if liability > 500)
    healthStatus = "critical";
    healthLabel = "High Risk / அதிக அபாயம்";
    healthMessage = "Debt is over 50% of your assets. Prioritize repayment.";
    healthColor = "text-rose-700 dark:text-rose-400";
    healthBg = "bg-rose-100 dark:bg-rose-900/30";
    healthBorder = "border-rose-200 dark:border-rose-800";
    HealthIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      </svg>
    );
  } else if (netFlow < 0) {
    // WARNING: Minor Deficit (within threshold)
    healthStatus = "warning";
    healthLabel = "Minor Deficit / சிறிய பற்றாக்குறை";
    healthMessage =
      "You are spending slightly more than you earn. Keep an eye on it.";
    healthColor = "text-amber-700 dark:text-amber-400";
    healthBg = "bg-amber-100 dark:bg-amber-900/30";
    healthBorder = "border-amber-200 dark:border-amber-800";
    HealthIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  } else if (debtToAssetRatio > 30 && isSignificantLiability) {
    // WARNING: Moderate Debt (Only if liability > 500)
    healthStatus = "warning";
    healthLabel = "Warning / எச்சரிக்கை";
    healthMessage = "Debt is becoming significant. Control your liabilities.";
    healthColor = "text-amber-700 dark:text-amber-400";
    healthBg = "bg-amber-100 dark:bg-amber-900/30";
    healthBorder = "border-amber-200 dark:border-amber-800";
    HealthIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  } else if (netWorth <= 0 && Math.abs(netFlow) < 0.01) {
    // WARNING: Vulnerable (No assets, no savings)
    healthStatus = "warning";
    healthLabel = "Vulnerable / பாதிப்புக்குள்ளாகும் நிலை";
    healthMessage =
      "You are breaking even but have no assets. Build a safety net.";
    healthColor = "text-amber-700 dark:text-amber-400";
    healthBg = "bg-amber-100 dark:bg-amber-900/30";
    healthBorder = "border-amber-200 dark:border-amber-800";
    HealthIcon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }

  // --- 4. Chart Logic ---
  const maxFlowBar = Math.max(income, expense) || 1;
  const incomeWidth = (income / maxFlowBar) * 100;
  const expenseWidth = (expense / maxFlowBar) * 100;

  const maxBalanceSheet = Math.max(totalAssets, totalLiabilities) || 1;

  // Calculate relative widths for Asset segments relative to the max bar width
  const cashWidth = (effectiveCashAsset / maxBalanceSheet) * 100;
  const investWidth = (investments / maxBalanceSheet) * 100;
  const lentWidth = (moneyLent / maxBalanceSheet) * 100;

  // Calculate relative widths for Liability segments relative to the max bar width
  const debtWidth = (debt / maxBalanceSheet) * 100;
  const overdraftWidth = (effectiveCashLiability / maxBalanceSheet) * 100;

  // --- 5. Flow Status Labels ---
  let flowStatusLabel = "Surplus / உபரி";
  let flowStatusClass =
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";

  if (netFlow < -0.01) {
    flowStatusLabel = "Deficit / பற்றாக்குறை";
    flowStatusClass =
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
  } else if (Math.abs(netFlow) < 0.01) {
    flowStatusLabel = "Break Even / சமநிலை";
    flowStatusClass =
      "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  }

  const getTitleForPeriod = (period: FilterPeriod) => {
      switch (period) {
        case FilterPeriod.TODAY: return { ta: "இன்று", en: 'Today' };
        case FilterPeriod.THIS_MONTH: return { ta: "இந்த மாதம்", en: 'This Month' };
        case FilterPeriod.LAST_MONTH: return { ta: 'கடந்த மாதம்', en: 'Last Month' };
        case FilterPeriod.CUSTOM: return { ta: 'குறிப்பிட்ட தேதியில்', en: 'in Range' };
        case FilterPeriod.ALL: return { ta: 'மொத்தம்', en: 'Overall' };
        default: return { ta: 'காலம்', en: 'Period' };
      }
  };

  const { en: main, ta: sub } = getTitleForPeriod(cashFlowFilter.period);

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* ROW 1: Net Worth & Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Net Worth Card */}
        <div className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col justify-center text-center md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Net Worth / நிகர மதிப்பு
          </h3>
          <p
            className={`text-3xl lg:text-4xl font-bold mt-2 ${
              netWorth >= 0
                ? "text-slate-800 dark:text-slate-100"
                : "text-red-500"
            }`}
          >
            {formatCurrency(netWorth)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Assets - Liabilities
          </p>
        </div>

        {/* Stoplight Health Score */}
        <div
          className={`p-6 rounded-2xl border shadow-md flex items-center gap-4 transition-all duration-300 ${healthBg} ${healthBorder}`}
        >
          <div
            className={`flex-shrink-0 p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm ${healthColor}`}
          >
            {HealthIcon}
          </div>
          <div>
            <h4 className={`text-xl font-bold ${healthColor}`}>
              {healthLabel}
            </h4>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">
              {healthMessage}
            </p>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="font-semibold">Ratio:</span>{" "}
              {debtToAssetRatio.toFixed(0)}% Debt
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span className="font-semibold">Flow:</span>{" "}
              {netFlow >= 0 ? "Positive" : "Negative"}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Balance Sheet (The Structure) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">
          Balance Sheet Structure
        </h3>

        {/* Assets Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total Assets / மொத்த சொத்துக்கள்
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {formatCurrency(totalAssets)}
            </span>
          </div>
          {/* The Asset Stack Bar */}
          <div className="relative h-5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-500 transition-all duration-500 border-r-2 border-white dark:border-slate-800"
              style={{ width: `${cashWidth}%` }}
            />
            <div
              className="h-full bg-cyan-500 transition-all duration-500 border-r-2 border-white dark:border-slate-800"
              style={{ width: `${lentWidth}%` }}
            />
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${investWidth}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
              <span className="text-slate-500 dark:text-slate-400">
                Cash ({formatCurrency(effectiveCashAsset)})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 block"></span>
              <span className="text-slate-500 dark:text-slate-400">
                Lent ({formatCurrency(moneyLent)})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 block"></span>
              <span className="text-slate-500 dark:text-slate-400">
                Inv. ({formatCurrency(investments)})
              </span>
            </div>
          </div>
        </div>

        {/* Liabilities Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total Liabilities / மொத்த பொறுப்புகள்
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {formatCurrency(totalLiabilities)}
            </span>
          </div>
          {/* The Liability Stack Bar */}
          <div className="relative h-5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${debtWidth}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${overdraftWidth}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
              <span className="text-slate-500 dark:text-slate-400">
                Debt ({formatCurrency(debt)})
              </span>
            </div>
            {effectiveCashLiability > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 block"></span>
                <span className="text-slate-500 dark:text-slate-400">
                  Overdraft ({formatCurrency(effectiveCashLiability)})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Cash Flow (The Pulse) */}
      <CashFlowFilterControls
        filter={cashFlowFilter}
        onOpenModal={onOpenModal}
        onResetFilter={onResetFilter}
      />
      <div
        className={`p-6 rounded-2xl border shadow-sm transition-all duration-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700`}
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Cash Flow ({main}) / பணப்புழக்கம் ({sub})
          </h4>
          <span
            className={`text-sm font-semibold px-2 py-1 rounded-md ${flowStatusClass}`}
          >
            {flowStatusLabel}
          </span>
        </div>

        {/* Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Income / வரவு
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-200">
                {formatCurrency(income)}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${incomeWidth}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Expenses / செலவு
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-200">
                {formatCurrency(expense)}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${expenseWidth}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Net Flow</span>
          <span
            className={`font-bold ${
              netFlow >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {netFlow >= 0 ? "+" : ""}
            {formatCurrency(netFlow)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealth;
