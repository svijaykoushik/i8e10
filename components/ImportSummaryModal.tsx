import React from 'react';
import type { FC } from 'react';
import Modal from './ui/Modal';

interface ParseError {
    originalRow: string[];
    message: string;
}

interface SummaryCount {
    added: number;
    updated: number;
}
interface ImportSummary {
    tx: SummaryCount;
    debt: SummaryCount;
    debtInst: SummaryCount;
    inv: SummaryCount;
    invTx: SummaryCount;
    error?: string;
    errors?: ParseError[];
}

interface ImportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ImportSummary | null;
}

const SummaryListItem: FC<{ count: SummaryCount; label: string }> = ({ count, label }) => {
    if (count.added === 0 && count.updated === 0) return null;

    return (
        <li>
            <strong>{label}:</strong> {count.added > 0 && `${count.added} added`}
            {count.added > 0 && count.updated > 0 && ", "}
            {count.updated > 0 && `${count.updated} updated`}
        </li>
    );
};


const ImportSummaryModal: FC<ImportSummaryModalProps> = ({ isOpen, onClose, summary }) => {
  if (!summary) return null;
  
  const hasError = !!summary.error;
  const hasWarnings = !!summary.errors && summary.errors.length > 0;
  const title = hasError ? 'Import Failed / இறக்குமதி தோல்வியுற்றது' : 'Import Complete! / இறக்குமதி முடிந்தது!';
  const totalProcessed = summary.tx.added + summary.tx.updated + summary.debt.added + summary.debt.updated + summary.inv.added + summary.inv.updated + summary.invTx.added + summary.invTx.updated;

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      OK
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
        <div className="space-y-4">
            {hasError ? (
                <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-300" role="alert">
                    <span className="font-medium">Error:</span> {summary.error}
                </div>
            ) : (
                <div className="text-slate-600 dark:text-slate-300">
                    {totalProcessed > 0 ? (
                        <>
                            <p>The import file was processed successfully:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                                <SummaryListItem count={summary.tx} label="Transactions / பரிவர்த்தனைகள்" />
                                <SummaryListItem count={summary.debt} label="Debts / கடன்கள்" />
                                <SummaryListItem count={summary.debtInst} label="Debt Installments / கடன் தவணைகள்" />
                                <SummaryListItem count={summary.inv} label="Investments / முதலீடுகள்" />
                                <SummaryListItem count={summary.invTx} label="Investment Transactions / முதலீட்டு பரிவர்த்தனைகள்" />
                            </ul>
                        </>
                    ) : (
                        <p>No new items to add or existing items to update were found in the import file. Your data is unchanged.</p>
                    )}
                </div>
            )}

            {hasWarnings && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-amber-700 dark:text-amber-300">Import Warnings ({summary.errors.length} skipped rows) / இறக்குமதி எச்சரிக்கைகள்</h4>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-2 rounded-md bg-slate-100 dark:bg-slate-700/50 p-3 text-xs">
                        {summary.errors.map((err, index) => (
                            <div key={index} className="border-b border-slate-200 dark:border-slate-600 last:border-b-0 pb-1.5 mb-1.5">
                                <p className="font-semibold text-red-600 dark:text-red-400">{err.message}</p>
                                <code className="text-slate-500 dark:text-slate-400 break-all">{err.originalRow.join(', ')}</code>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </Modal>
  );
};

export default ImportSummaryModal;