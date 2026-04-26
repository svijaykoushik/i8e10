import { FC } from "react";

interface MigrationRequiredModalProps {
  handleExportAllData: () => Promise<void>;
  handleRunMigration: () => Promise<void>;
  migrationBackupDone: boolean;
  setMigrationBackupDone: (value: boolean) => void;
}

export const MigrationRequiredModal: FC<MigrationRequiredModalProps> = ({ handleExportAllData, handleRunMigration, migrationBackupDone, setMigrationBackupDone }) => {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center z-50 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 text-center">
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Data Upgrade Required / தரவு மேம்படுத்தல் தேவை</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Your data needs to be upgraded to the new double-entry accounting format.
            This is a one-time process that will improve data integrity.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6 text-left">
            <p className="text-amber-800 dark:text-amber-200 font-semibold text-sm mb-2">⚠️ Important: Back up your data first! / முதலில் உங்கள் தரவை காப்புப் பிரதி எடுக்கவும்!</p>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Please export a backup of your data before proceeding. This ensures you can recover your data if anything goes wrong.
            </p>
          </div>

          {!migrationBackupDone ? (
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    await handleExportAllData();
                    setMigrationBackupDone(true);
                  } catch (e) {
                    console.error('Backup failed:', e);
                  }
                }}
                className="w-full py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm font-medium transition"
              >
                Export Backup / காப்புப் பிரதி எடு
              </button>
              <button
                onClick={() => setMigrationBackupDone(true)}
                className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2"
              >
                I already have a recent backup — skip
              </button>
            </div>
          ) : (
            <button
              onClick={handleRunMigration}
              className="w-full py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm font-medium transition"
            >
              Proceed with Migration / மேம்படுத்தலை தொடங்கு
            </button>
          )}
        </div>
      </div>
    );
};