 import React, { useState, useEffect, useRef, useMemo } from "react";
import type { FC } from "react";
import { Debt, DebtType, DebtStatus, DebtInstallment } from "../types";
import { trackUserAction } from "../utils/tracking";

interface DebtItemProps {
  debt: Debt;
  installments: DebtInstallment[];
  onEdit: (debt: Debt) => void;
  onSettle: (debt: Debt) => void;
  onForgive: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onAddInstallment: (debt: Debt) => void;
  onEditInstallment: (inst: DebtInstallment) => void;
  onDeleteInstallment: (inst: DebtInstallment) => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );
const formatDate = (dateString: string) =>
  new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const DebtItem: FC<DebtItemProps> = ({
  debt,
  installments,
  onEdit,
  onSettle,
  onForgive,
  onDelete,
  onAddInstallment,
  onEditInstallment,
  onDeleteInstallment,
}: DebtItemProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLent = debt.type === DebtType.LENT;
  const isSettled = debt.status === DebtStatus.SETTLED;
  const isWaived = debt.status === DebtStatus.WAIVED;
  const isClosed = isSettled || isWaived;

  const paidAmount = useMemo(() => {
    // 1. Check if the debt is settled AND there are no installments (backward compatibility)
    if (isSettled && (!installments || installments.length === 0)) {
      // If settled and no installments, assume the paid amount is the total debt amount
      return debt.amount;
    }

    // 2. Otherwise, calculate the paid amount from the installments
    return (installments || []).reduce((sum, inst) => sum + inst.amount, 0);
  }, [installments, isSettled, debt.amount]);

  const progressPercent = Math.min((paidAmount / debt.amount) * 100, 100);

  const borderColor = isSettled
    ? "border-slate-300 dark:border-slate-600"
    : isLent
    ? "border-blue-400 dark:border-blue-500/50"
    : "border-orange-400 dark:border-orange-500/50";

  const iconBg = isSettled
    ? "bg-slate-200 dark:bg-slate-700"
    : isLent
    ? "bg-blue-100 dark:bg-blue-500/20"
    : "bg-orange-100 dark:bg-orange-500/20";

  const iconColor = isSettled
    ? "text-slate-500"
    : isLent
    ? "text-blue-500"
    : "text-orange-500";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willBeOpen = !menuOpen;
    if (willBeOpen) {
      trackUserAction("open_debt_menu");
    }
    setMenuOpen(willBeOpen);
  };

  const formattedDate = new Date(debt.date + "T00:00:00").toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(debt.amount);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const Icon = () => {
    let iconPath;
    if (isLent) {
      iconPath = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      );
    } else {
      iconPath = (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 17l-5-5m0 0l5-5m-5 5h12"
        />
      );
    }
    return (
      <div className={`p-3 rounded-full ${iconBg}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {iconPath}
        </svg>
      </div>
    );
  };

  return (
    <li
      className={`relative bg-white dark:bg-slate-800 p-4 border-l-4 ${borderColor} rounded-r-lg shadow-sm transition-all duration-300 animate-fadeInUp ${
        isClosed ? "opacity-60" : ""
      } ${menuOpen ? "z-20" : "z-auto"}`}
    >
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <Icon />
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <p
                className={`font-semibold text-slate-800 dark:text-slate-100 ${
                  isClosed ? "line-through" : ""
                }`}
              >
                {isLent ? `Lent to ${debt.person}` : `Owed to ${debt.person}`}
              </p>
              <p
                className={`text-sm text-slate-500 dark:text-slate-400 ${
                  isClosed ? "line-through" : ""
                }`}
              >
                {debt.description || "No description"}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`font-bold text-lg ${
                  isClosed
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {formattedAmount}
              </p>
              {!isClosed && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                  Outstanding
                </span>
              )}
              {isSettled && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  Settled
                </span>
              )}
              {isWaived && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Forgiven
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{formatDate(debt.date)}</span>
            <span>Paid: {formatCurrency(paidAmount)}</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                isClosed
                  ? "bg-slate-400"
                  : isLent
                  ? "bg-blue-500"
                  : "bg-orange-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={handleMenuToggle}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 origin-top-right">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {!isClosed && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddInstallment(debt);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      role="menuitem"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Installment
                    </button>
                    <button
                      onClick={() => {
                        onSettle(debt);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      role="menuitem"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6-4a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Settle
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onForgive(debt);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      role="menuitem"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                      {isLent ? "Forgive debt" : "Mark as forgiven"}
                    </button>
                    <button
                      onClick={() => {
                        onEdit(debt);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      role="menuitem"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                        />
                      </svg>
                      Edit
                    </button>
                    <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  </>
                )}
                <button
                  onClick={() => {
                    onDelete(debt);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  role="menuitem"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {isExpanded && installments && installments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fadeInUp">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Installment History
          </h4>
          <div className="space-y-2">
            {[...installments]
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((inst) => (
                <InstallmentItem
                  key={inst.id}
                  inst={inst}
                  onEdit={onEditInstallment}
                  onDelete={onDeleteInstallment}
                  isEditable={!isClosed}
                />
              ))}
          </div>
        </div>
      )}
    </li>
  );
};

interface InstallmentItemProps {
  inst: DebtInstallment;
  onEdit: (inst: DebtInstallment) => void;
  onDelete: (inst: DebtInstallment) => void;
  isEditable: boolean;
}

const InstallmentItem: FC<InstallmentItemProps> = ({
  inst,
  onEdit,
  onDelete,
  isEditable,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div
      className={`flex justify-between items-center py-2 px-3 rounded-md bg-slate-50 dark:bg-slate-700/50
          ${menuOpen ? "relative z-10" : ""}`}
    >
      <div>
        <span className="text-slate-700 dark:text-slate-200 font-medium">
          {formatDate(inst.date)}
        </span>
        {inst.note && (
          <span className="ml-2 text-slate-500 dark:text-slate-400 text-xs">
            - {inst.note}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {formatCurrency(inst.amount)}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 origin-top-right">
              <div className="py-1">
                <button
                  onClick={() => {
                    onEdit(inst);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isEditable}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(inst);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isEditable}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtItem;
