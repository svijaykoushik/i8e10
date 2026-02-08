import React from "react";
import type { FC } from "react";
import { Debt, DebtType } from "../types";
import Modal from "./ui/Modal";

interface ForgiveDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  debt: Debt | null;
}

const ForgiveDebtModal: FC<ForgiveDebtModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  debt,
}: ForgiveDebtModalProps) => {
  if (!debt) return null;

  const isLent = debt.type === DebtType.LENT;
  const title = isLent ? "Forgive Debt" : "Mark as Forgiven";

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="btn-press inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
      >
        Confirm
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <div className="text-slate-600 dark:text-slate-300 space-y-4">
        <div
          className="p-4 text-sm text-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300"
          role="alert"
        >
          <p className="font-bold">This will mark the debt as closed.</p>
          <p className="mt-1">
            No transaction will be created for the remaining balance. This is
            useful if the debt was waived or forgiven.
          </p>
        </div>

        <p className="text-center">
          Are you sure you want to mark this debt with{" "}
          <strong>{debt.person}</strong> as forgiven?
        </p>
      </div>
    </Modal>
  );
};

export default ForgiveDebtModal;
