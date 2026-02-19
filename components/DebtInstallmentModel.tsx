import React, { useState, useEffect, useRef } from "react";
import type { FC, FormEvent } from "react";
import { Debt, DebtType, DebtInstallment, DebtStatus, Wallet } from "../types";
import Modal from "./ui/Modal";

interface DebtInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    installmentData: Omit<DebtInstallment, "id">;
    createTransaction: boolean;
    markAsSettled: boolean;
    wallet: string;
    createSurplusRecord?: boolean;
  }) => void;
  debt: Debt | null;
  installmentToEdit: DebtInstallment;
  installmentsForDebt: DebtInstallment[];
  wallets: Wallet[];
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DebtInstallmentModal: FC<DebtInstallmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  debt,
  wallets,
  installmentToEdit,
  installmentsForDebt,
}: DebtInstallmentModalProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [note, setNote] = useState("");
  const [createTransaction, setCreateTransaction] = useState(true);
  const [markAsSettled, setMarkAsSettled] = useState(false);
  const [walletId, setWalletId] = useState("");
  const [createSurplusRecord, setCreateSurplusRecord] = useState(false);

  const markAsSettledRef = useRef(markAsSettled);

  const isMarkAsSettledDirty = markAsSettled !== markAsSettledRef.current;

  const isEditMode = !!installmentToEdit;

  const paidAmount = (installmentsForDebt || []).reduce(
    (sum, inst) => sum + inst.amount,
    0
  );
  const remainingAmount = debt ? Math.max(0, debt.amount - paidAmount) : 0;

  // Watch for amount changes to suggest settlement or surplus
  useEffect(() => {
    if (!amount) {
      setCreateSurplusRecord(false);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;

    // Tolerance for floating point comparison
    const diff = numericAmount - remainingAmount;

    if (Math.abs(diff) < 0.01) {
      // Exact match
      setMarkAsSettled(true);
      setCreateSurplusRecord(false);
    } else if (diff > 0.01) {
      // Overpayment
      setMarkAsSettled(true);
      // Default to FALSE to "ask" the user (they must opt-in)
      setCreateSurplusRecord(false);
    } else {
      // Partial payment - usually keeps debt outstanding
      setMarkAsSettled((prev) => (prev === true && isMarkAsSettledDirty === false ? false : prev));
    }
  }, [amount, remainingAmount, isMarkAsSettledDirty]);

  useEffect(() => {
    if (isOpen && debt) {
      if (isEditMode) {
        setAmount(String(installmentToEdit.amount));
        setDate(installmentToEdit.date);
        setNote(installmentToEdit.note || "");
      } else {
        setAmount("");
        setDate(getLocalDateString());
        setNote("");
        setCreateTransaction(true);
        setMarkAsSettled(false);
        setWalletId(wallets.length > 0 ? wallets[0].id : "");
        setCreateSurplusRecord(false);
      }
    }
  }, [isOpen, debt, wallets, isEditMode, installmentToEdit]);

  const handleCreateTransactionToggle = (isChecked: boolean) => {
    setCreateTransaction(isChecked);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount || !date || (createTransaction && !walletId && !isEditMode)) return;

    onSave({
      installmentData: ({
        id: isEditMode? installmentToEdit.id: undefined,
        amount: parseFloat(amount),
        date,
        note,
        debtId: debt?.id
      } as DebtInstallment),
      createTransaction: !isEditMode && createTransaction,
      markAsSettled,
      wallet: !isEditMode ? walletId : '',
      createSurplusRecord,
    });
  };

  const isLent = debt?.type === DebtType.LENT;
  const surplusType = isLent ? "Owed" : "Lent"; // Inverse type
  const surplusLabel = isLent
    ? "Owed (கடன் வாங்கியது)"
    : "Lent (கடன் கொடுத்தது)";
  const currentAmount = parseFloat(amount) || 0;
  const excessAmount = Math.max(0, currentAmount - remainingAmount);

  const inputBaseClasses =
    "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses =
    "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="installment-form"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Save Installment
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLent ? "Receive Payment" : "Make Payment"}
      footer={footer}
    >
      <form id="installment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            Remaining Balance:
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(remainingAmount)}
          </span>
        </div>

        <div>
          <label htmlFor="inst-amount" className={labelClasses}>
            Amount / தொகை
          </label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              id="inst-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputBaseClasses} pl-7`}
              placeholder="0.00"
              required
              autoFocus
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label htmlFor="inst-date" className={labelClasses}>
            Date / தேதி
          </label>
          <div className="mt-2">
            <input
              type="date"
              id="inst-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputBaseClasses}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="inst-note" className={labelClasses}>
            Note (Optional)
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="inst-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputBaseClasses}
              placeholder="e.g., Part payment"
            />
          </div>
        </div>

        <div className={`p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 space-y-4 ${isEditMode ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between">
            <label
              htmlFor="create-transaction-inst"
              className="flex flex-col cursor-pointer flex-grow pr-4"
            >
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {isLent
                  ? "Add to Wallet (Income)"
                  : "Deduct from Wallet (Expense)"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Creates a corresponding transaction.
              </span>
            </label>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                id="create-transaction-inst"
                checked={createTransaction}
                onChange={(e) =>
                  handleCreateTransactionToggle(e.target.checked)
                }
                className="sr-only peer"
                disabled={isEditMode}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          {createTransaction && (
            <div
              className="animate-fadeInUp"
              style={{ animationDuration: "0.3s" }}
            >
              <label htmlFor="wallet-inst" className={labelClasses}>
                Wallet / கணக்கு
              </label>
              <div className="mt-2">
                <select
                  name="wallet-inst"
                  id="wallet-inst"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className={inputBaseClasses}
                  required
                  disabled={isEditMode}
                >
                  {wallets.length > 0 ? (
                    wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No wallets found
                    </option>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <input
              id="mark-settled"
              type="checkbox"
              checked={markAsSettled}
              onChange={(e) => setMarkAsSettled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label
              htmlFor="mark-settled"
              className="ml-3 block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100"
            >
              Mark debt as fully settled
            </label>
          </div>

          {excessAmount > 0.01 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 animate-fadeInUp">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                <strong>Overpayment!</strong> This amount exceeds the remaining
                balance by{" "}
                <strong>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(excessAmount)}
                </strong>
                .
              </p>
              <div className="flex items-center">
                <input
                  id="create-surplus"
                  type="checkbox"
                  checked={createSurplusRecord}
                  onChange={(e) => setCreateSurplusRecord(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-600"
                />
                <label
                  htmlFor="create-surplus"
                  className="ml-3 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Create new <strong>{surplusLabel}</strong> record for the
                  extra amount?
                </label>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default DebtInstallmentModal;
