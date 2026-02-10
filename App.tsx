import type { FC, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AddTransactionButton from './components/AddTransactionButton';
import PasswordSetupModal from './components/auth/PasswordSetupModal';
import UnlockModal from './components/auth/UnlockModal';
import BackupReminderBanner from './components/BackupReminderBanner';
import BalanceSummary from './components/BalanceSummary';
import BulkAddModal from './components/BulkAddModal';
import CashFlowFilterModal from './components/CashFlowFilterModal';
import ClearDataConfirmationModal from './components/ClearDataConfirmationModal';
import DebtFilterControls from './components/DebtFilterControls';
import DebtFilterModal from './components/DebtFilterModal';
import DebtFormModal from './components/DebtFormModal';
import DebtInstallmentModal from './components/DebtInstallmentModel';
import DebtList from './components/DebtList';
import DebtSummary from './components/DebtSummary';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import FilterControls from './components/FilterControls';
import FilterModal from './components/FilterModal';
import FinancialHealth from './components/FinancialHealth';
import ForgiveDebtModal from './components/ForgiveDebtModal';
import ImportSummaryModal from './components/ImportSummaryModal';
import InvestmentFilterControls from './components/InvestmentFilterControls';
import InvestmentFilterModal from './components/InvestmentFilterModal';
import InvestmentFormModal from './components/InvestmentFormModal';
import InvestmentList from './components/InvestmentList';
import InvestmentSummary from './components/InvestmentSummary';
import InvestmentTransactionFormModal from './components/InvestmentTransactionFormModal';
import OnboardingGuide from './components/OnboardingGuide';
import ReconcileBalanceModal from './components/ReconcileBalanceModal';
import SellInvestmentModal from './components/SellInvestmentModal';
import SettingsModal from './components/SettingsModal';
import SettleDebtModal from './components/SettleDebtModal';
import TransactionFormModal from './components/TransactionFormModal';
import TransactionList from './components/TransactionList';
import AlertModal from './components/ui/AlertModal';
import UpdateInvestmentValueModal from './components/UpdateInvestmentValueModal';
import { liveQuery } from './src/db/liveQuery';
import { ActionType, ActiveView, CashFlowFilterState, Debt, DebtFilterState, DebtFilterStatus, DebtFilterType, DebtInstallment, DebtStatus, DebtType, FilterPeriod, FilterState, Investment, InvestmentFilterState, InvestmentFilterStatus, InvestmentStatus, InvestmentTransaction, InvestmentTransactionType, Transaction, TransactionFilterType, TransactionType } from './types';
import * as cryptoService from './utils/cryptoService';
import { generateDebtInstallmentsCSV, generateDebtsCSV, generateInvestmentsCSV, generateInvestmentTransactionsCSV, generateTransactionsCSV } from './utils/csvExporter';
import { parseDebtInstallmentsCSV, parseDebtsCSV, ParseError, parseInvestmentsCSV, parseInvestmentTransactionsCSV, parseTransactionsCSV } from './utils/csvImporter';
import { db, type AppSetting } from './utils/db';
import { exportToZip, readZip } from './utils/zipExporter';

// --- Recovery Modals (Inlined to avoid new files) ---

const RecoveryPhraseModal: FC<{ phrase: string; onConfirm: () => void }> = ({ phrase, onConfirm }) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const words = phrase.split(' ');

    const handleDownload = () => {
        const content = `i8·e10 Recovery Phrase\n\n${phrase}\n\nPlease store this phrase in a safe and secret place. It is the only way to recover your data if you forget your password.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'i8e10-recovery-phrase.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeInUp">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your Recovery Phrase</h2>
                </div>
                <div className="p-6">
                    <p className="text-center text-red-600 dark:text-red-400 font-semibold">This is the ONLY time you will see this phrase. Write it down and keep it safe.</p>
                    <div className="my-4 grid grid-cols-3 gap-2 text-center bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                        {words.map((word, index) => (
                            <div key={index} className="font-mono text-slate-700 dark:text-slate-200">
                                <span className="text-xs text-slate-400">{index + 1}. </span>{word}
                            </div>
                        ))}
                    </div>
                    <label className="flex items-center space-x-3 mt-4 cursor-pointer">
                        <input type="checkbox" checked={isConfirmed} onChange={() => setIsConfirmed(!isConfirmed)} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-slate-700 dark:text-slate-200">I have written down my recovery phrase.</span>
                    </label>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row-reverse gap-3">
                    <button onClick={onConfirm} disabled={!isConfirmed} className="w-full sm:w-auto btn-press py-3 px-4 text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm font-medium disabled:bg-green-400 disabled:cursor-not-allowed">
                        Finish Setup
                    </button>
                    <button onClick={handleDownload} className="w-full sm:w-auto btn-press flex items-center justify-center gap-2 py-3 px-4 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Phrase
                    </button>
                </div>
            </div>
        </div>
    );
};

const RecoverAccountModal: FC<{ onRecover: (phrase: string, newPass: string) => Promise<string | null>; onClose: () => void; onRequestReset: () => void; }> = ({ onRecover, onClose, onRequestReset }) => {
    const [phrase, setPhrase] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        setIsProcessing(true);
        setError('');
        const err = await onRecover(phrase, newPassword);
        if (err) {
            setError(err);
            setIsProcessing(false);
        }
    };

    const inputClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeInUp">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recover Your Account</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <textarea value={phrase} onChange={e => setPhrase(e.target.value)} rows={3} placeholder="Enter your 12-word recovery phrase..." className={inputClasses} required />
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className={inputClasses} required />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className={inputClasses} required />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <button type="submit" disabled={isProcessing} className="w-full btn-press py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm font-medium disabled:bg-indigo-400">
                            {isProcessing ? 'Recovering...' : 'Recover & Set New Password'}
                        </button>
                        <button type="button" onClick={onRequestReset} className="w-full text-center text-sm text-slate-500 hover:text-red-500">Still can't recover? Reset App</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- App Component ---

// Fix: Define type for import summary to resolve type errors.
type ImportResultSummary = {
    tx: { added: number; updated: number };
    debt: { added: number; updated: number };
    debtInst: { added: number; updated: number }
    inv: { added: number; updated: number };
    invTx: { added: number; updated: number };
};

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type AppStatus = 'LOADING' | 'LOCKED' | 'SETUP_REQUIRED' | 'UNLOCKED' | 'MIGRATING';

const FullScreenLoader: FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center z-50">
        <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">{message}</p>
    </div>
);


const App: FC = () => {
  const [appStatus, setAppStatus] = useState<AppStatus>('LOADING');
  const [pendingRecoveryPhrase, setPendingRecoveryPhrase] = useState<string | null>(null);
  
  // Data from IndexedDB
  const [transactions, setTransactions] = useState<Transaction[] | undefined>();
  useEffect(() => {
    if (appStatus !== 'UNLOCKED') return;
    const sub = liveQuery(async () => {
      const txns = await db.transactionItems.orderBy('date').reverse().toArray()
      return txns;
    }).subscribe((val: Transaction[])=>setTransactions(val));
    return () => sub.unsubscribe();
  }, [appStatus]);

  const [debts, setDebts] = useState<Debt[] | undefined>(undefined);
  useEffect(() => {
    if (appStatus !== 'UNLOCKED') return;
    const sub = liveQuery(() => db.debts.orderBy('date').reverse().toArray()).subscribe((val:Debt[])=>setDebts(val));
    return () => sub.unsubscribe();
  }, [appStatus]);

  const [debtInstallments, setDebtInstallments] = useState<DebtInstallment[] | undefined>();
  useEffect(() => {
    if (appStatus !== 'UNLOCKED') return;
    const sub = liveQuery(() => db.debtInstallements.orderBy('date').reverse().toArray()).subscribe((val: DebtInstallment[])=>{
      console.log("Debt installments", val);
      return setDebtInstallments(val)
    });
    return () => sub.unsubscribe();
  }, [appStatus]);

  const [investments, setInvestments] = useState<Investment[] | undefined>();
  useEffect(() => {
    if (appStatus !== 'UNLOCKED') return;
    const sub = liveQuery(() => db.investments.orderBy('startDate').reverse().toArray()).subscribe((val: Investment[])=>setInvestments(val));
    return () => sub.unsubscribe();
  }, [appStatus]);

  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[] | undefined>();
  useEffect(() => {
    if (appStatus !== 'UNLOCKED') return;
    const sub = liveQuery(() => db.investmentTransactions.toArray()).subscribe(setInvestmentTransactions);
    return () => sub.unsubscribe();
  }, [appStatus]);

  const [settingsArray, setSettingsArray] = useState<AppSetting[] | undefined>();
  useEffect(() => {
    const sub = liveQuery(() => db.settings.toArray()).subscribe(setSettingsArray);
    return () => sub.unsubscribe();
  }, []);

  const settings = useMemo(() => {
    const settingsMap: { [key: string]: any } = {};
    if (settingsArray) {
        for (const setting of settingsArray) {
            settingsMap[setting.key] = setting.value;
        }
    }
    return {
        wallets: (settingsMap.wallets ?? ['Cash / ரொக்கம்', 'Bank / வங்கி']) as string[],
        onboardingCompleted: settingsMap.onboardingCompleted ?? false,
        defaultFilterPeriod: settingsMap.defaultFilterPeriod ?? FilterPeriod.THIS_MONTH,
        defaultWallet: settingsMap.defaultWallet ?? 'Cash / ரொக்கம்',
        lastBackupDate: settingsMap.lastBackupDate ?? null,
        backupReminderDismissedUntil: settingsMap.backupReminderDismissedUntil ?? null,
        appFirstUseDate: settingsMap.appFirstUseDate ?? null,
        deficitThreshold: settingsMap.deficitThreshold ?? 1000,
    };
  }, [settingsArray]);
  
  const { wallets, onboardingCompleted, defaultFilterPeriod, defaultWallet, lastBackupDate, backupReminderDismissedUntil, appFirstUseDate, deficitThreshold } = settings;

  const [activeView, setActiveView] = useState<ActiveView>('transactions');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [backupReminder, setBackupReminder] = useState<{ show: boolean; days: number | null }>({ show: false, days: null });
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDebtFormModalOpen, setIsDebtFormModalOpen] = useState(false);
  const [isInvestmentFormModalOpen, setIsInvestmentFormModalOpen] = useState(false);
  const [isInvestmentTransactionFormModalOpen, setIsInvestmentTransactionFormModalOpen] = useState(false);
  const [isUpdateValueModalOpen, setIsUpdateValueModalOpen] = useState(false);
  const [isSellInvestmentModalOpen, setIsSellInvestmentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isDebtInstallmentModalOpen, setIsDebtInstallmentModalOpen] = useState(false);
  const [debtForInstallment, setDebtForInstallment] = useState<Debt | null>(null);
  const [installmentsForDebt, setInstallmentsForDebt] = useState<DebtInstallment[] | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDebtFilterModalOpen, setIsDebtFilterModalOpen] = useState(false);
  const [isInvestmentFilterModalOpen, setIsInvestmentFilterModalOpen] = useState(false);
  const [isCashFlowFilterModalOpen, setIsCashFlowFilterModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const [importSummaryModal, setImportSummaryModal] = useState<{ isOpen: boolean; summary: any | null }>({ isOpen: false, summary: null });
  const [isRecoverAccountModalOpen, setIsRecoverAccountModalOpen] = useState(false);
  
  // Item state for modals
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialTransactionData, setInitialTransactionData] = useState<Partial<Transaction> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Transaction | Debt | DebtInstallment | Investment | InvestmentTransaction | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [settlingDebt, setSettlingDebt] = useState<Debt | null>(null);
  const [settlingDebtInstallments, setSettlingDebtInstallments] = useState<DebtInstallment[] | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [forgivingDebt, setForgivingDebt] = useState<Debt | null>(null);
  const [isForgiveModalOpen, setIsForgiveModalOpen] = useState(false);
  const [editingInvestmentTransaction, setEditingInvestmentTransaction] = useState<InvestmentTransaction | null>(null);
  const [addingTransactionToInvestment, setAddingTransactionToInvestment] = useState<Investment | null>(null);
  const [updatingInvestment, setUpdatingInvestment] = useState<Investment | null>(null);
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<DebtInstallment | null>(null);

  const [animatingOutIds, setAnimatingOutIds] = useState<string[]>([]);

  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [initialDebtType, setInitialDebtType] = useState<DebtType>(DebtType.LENT);

  const correctedDefaultWallet = useMemo(() => {
    if (defaultWallet !== 'all' && !wallets.includes(defaultWallet)) {
      return 'all';
    }
    return defaultWallet;
  }, [defaultWallet, wallets]);

  useEffect(() => {
    if (correctedDefaultWallet !== defaultWallet) {
      db.settings.put({ key: 'defaultWallet', value: correctedDefaultWallet });
    }
  }, [correctedDefaultWallet, defaultWallet]);

  const [filter, setFilter] = useState<FilterState>({
    period: defaultFilterPeriod,
    startDate: getLocalDateString(),
    endDate: getLocalDateString(),
    wallet: correctedDefaultWallet,
    transactionType: TransactionFilterType.ALL,
  });
  
  const [debtFilter, setDebtFilter] = useState<DebtFilterState>({
    status: DebtFilterStatus.ALL,
    type: DebtFilterType.ALL,
    period: FilterPeriod.THIS_MONTH,
    startDate: getLocalDateString(),
    endDate: getLocalDateString(),
  });

  const [investmentFilter, setInvestmentFilter] = useState<InvestmentFilterState>({
    status: InvestmentFilterStatus.ALL,
    type: 'all',
    period: FilterPeriod.THIS_MONTH,
    startDate: getLocalDateString(),
    endDate: getLocalDateString(),
  });

  const [cashFlowFilter, setCashFlowFilter] = useState<CashFlowFilterState>({
    period: FilterPeriod.ALL,
    startDate: getLocalDateString(),
    endDate: getLocalDateString(),
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const showAlert = (title: string, message: string) => {
    setAlertModal({ isOpen: true, title, message });
  };

  useEffect(() => {
    const initializeApp = async () => {
      const salt = await db.settings.get('encryptionSalt');
      if (salt) {
        setAppStatus('LOCKED');
      } else {
        // No encryption set up yet, go to SETUP_REQUIRED
        // Data migration will happen during handlePasswordSet with encryption middleware active
        setAppStatus('SETUP_REQUIRED');
      }
    };
    initializeApp();
  }, []);

  // Check for backup reminder
  useEffect(() => {
    if (appStatus !== 'UNLOCKED') return;

    const hasDataToBackup = (transactions?.length ?? 0) > 0 || (debts?.length ?? 0) > 0 || (investments?.length ?? 0) > 0;
    if (!hasDataToBackup) {
      setBackupReminder({ show: false, days: null });
      return;
    }

    const now = new Date();
    const dismissedUntil = backupReminderDismissedUntil ? new Date(backupReminderDismissedUntil) : null;
    if (dismissedUntil && now < dismissedUntil) {
      setBackupReminder({ show: false, days: null });
      return;
    }

    if (!lastBackupDate) {
      // INITIAL backup reminder: only show if it's been 3 days since first use.
      if (appFirstUseDate) {
        const firstUseDate = new Date(appFirstUseDate);
        const daysSinceFirstUse = (now.getTime() - firstUseDate.getTime()) / (1000 * 3600 * 24);
        if (daysSinceFirstUse >= 3) {
          setBackupReminder({ show: true, days: null });
        } else {
          setBackupReminder({ show: false, days: null });
        }
      } else {
        setBackupReminder({ show: false, days: null });
      }
    } else {
      // SUBSEQUENT backup reminders: every 15 days.
      const lastBackup = new Date(lastBackupDate);
      const daysSince = (now.getTime() - lastBackup.getTime()) / (1000 * 3600 * 24);
      if (daysSince > 15) {
        setBackupReminder({ show: true, days: Math.floor(daysSince) });
      } else {
        setBackupReminder({ show: false, days: null });
      }
    }
  }, [appStatus, lastBackupDate, backupReminderDismissedUntil, transactions, debts, investments, appFirstUseDate]);


  /**
   * Handles migration from Local Storage to Indexed DB
   * @param oldDataKeys Array of keys to be migrated from local storage
   */
  const handleLSToIDBMigration = async (oldDataKeys: string[]) => {
    try {
      let transactions = JSON.parse(
        localStorage.getItem("transactions") || "[]"
      );
      let debts = JSON.parse(localStorage.getItem("debts") || "[]");
      let investments = JSON.parse(localStorage.getItem("investments") || "[]");
      let investmentTransactions = JSON.parse(
        localStorage.getItem("investmentTransactions") || "[]"
      );

      // Ensure migrated records have primary keys expected by IndexedDB stores.
      // Older localStorage exports may not include `id` fields.
      transactions = transactions.map((t: any) =>
        t.id ? t : { ...t, id: crypto.randomUUID() }
      );
      debts = debts.map((d: any) =>
        d.id ? d : { ...d, id: crypto.randomUUID() }
      );
      investments = investments.map((i: any) =>
        i.id ? i : { ...i, id: crypto.randomUUID() }
      );
      investmentTransactions = investmentTransactions.map((it: any) =>
        it.id ? it : { ...it, id: crypto.randomUUID() }
      );
      const settingsToStore: AppSetting[] = [
        {
          key: "wallets",
          value: JSON.parse(
            localStorage.getItem("wallets") ||
              '["Cash / ரொக்கம்", "Bank / வங்கி"]'
          ),
        },
        {
          key: "onboardingCompleted",
          value: JSON.parse(
            localStorage.getItem("onboardingCompleted") || "false"
          ),
        },
        {
          key: "trackingConsent",
          value: JSON.parse(localStorage.getItem("trackingConsent") || "null"),
        },
        {
          key: "defaultFilterPeriod",
          value: JSON.parse(
            localStorage.getItem("defaultFilterPeriod") ||
              `"${FilterPeriod.THIS_MONTH}"`
          ),
        },
        {
          key: "defaultWallet",
          value: JSON.parse(
            localStorage.getItem("defaultWallet") || '"Cash / ரொக்கம்"'
          ),
        },
        { key: "migrationToIDBComplete_v1", value: true },
      ];

      // Fix: Pass tables as an array to db.transaction
      await db.transaction(
        "rw",
        [
          db.transactionItems,
          db.debts,
          db.investments,
          db.investmentTransactions,
          db.settings,
        ],
        async () => {
          if (transactions.length > 0)
            await db.transactionItems.bulkPut(transactions);
          if (debts.length > 0) await db.debts.bulkPut(debts);
          if (investments.length > 0) await db.investments.bulkPut(investments);
          if (investmentTransactions.length > 0)
            await db.investmentTransactions.bulkPut(investmentTransactions);
          await db.settings.bulkPut(settingsToStore);
        }
      );

      oldDataKeys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("Data migration failed:", error);
      showAlert(
        "Migration Failed",
        "A critical error occurred while upgrading the app."
      );
    }
  }

  const handlePasswordSet = async (password: string) => {
    setAppStatus('MIGRATING');
    try {
        
        // Step 1: Set up encryption and re-encrypt all data with the encryption middleware active
        const { salt, verifier, wrappedMasterKey, wrappedMasterKeyByRecovery, recoveryPhraseHash, recoveryPhrase } = await cryptoService.setupEncryption(password);


        // Step 2: Migrate data from localStorage to IndexedDB before encryption setup
        const oldDataKeys = ['transactions', 'debts', 'investments', 'investmentTransactions', 'wallets', 'onboardingCompleted', 'trackingConsent', 'defaultFilterPeriod', 'defaultWallet'];
        const anyOldDataExists = oldDataKeys.some(key => localStorage.getItem(key) !== null);
        const isMigrated = await db.settings.get('migrationToIDBComplete_v1');
        
        if (anyOldDataExists && !isMigrated) {
          try {
            await handleLSToIDBMigration(oldDataKeys);
          } catch (error) {
            console.error("Data migration failed:", error);
            showAlert(
              "Migration Failed",
              "A critical error occurred while upgrading the app."
            );
            setAppStatus('SETUP_REQUIRED');
            return;
          }
        }
        
        // Fix: Pass tables as an array to db.transaction
        await db.transaction('rw', [db.transactionItems, db.debts, db.investments, db.investmentTransactions, db.settings], async () => {
            // Re-write all items to trigger encryption middleware.
            const tablesToReEncrypt = [db.transactionItems, db.debts, db.investments, db.investmentTransactions];
            for (const rawTable of tablesToReEncrypt) {
                const table: any = rawTable; // cast to any to avoid cross-table generic inference issues
                // Fetch all primary keys first. This is memory-efficient as keys are small.
                const allKeys = await (await table.toCollection()).primaryKeys();
                if (allKeys.length === 0) continue;

                const chunkSize = 500;
                for (let i = 0; i < allKeys.length; i += chunkSize) {
                    const keyChunk = allKeys.slice(i, i + chunkSize);
                    // Fetch the actual items for the current chunk of keys.
                    // toArray() uses the 'query' hook which will correctly return plaintext objects.
                    const items = await table.where(':id').anyOf(keyChunk).toArray();
                    if (items.length > 0) {
                        // bulkPut() uses the 'mutate' hook, which will encrypt the items before saving.
                        await table.bulkPut(items as any);
                    }
                }
            }
            
            await db.settings.bulkPut([
              { key: 'encryptionSalt', value: salt },
              { key: 'encryptionVerifier', value: verifier },
              { key: 'wrappedMasterKey', value: wrappedMasterKey },
              { key: 'wrappedMasterKeyByRecovery', value: wrappedMasterKeyByRecovery },
              { key: 'recoveryPhraseHash', value: recoveryPhraseHash },
              { key: 'migrationToIDBComplete_v1', value: true },
            ]);
        });

        setPendingRecoveryPhrase(recoveryPhrase);
        setAppStatus('SETUP_REQUIRED'); // Exit migration state to show phrase modal
    } catch (error) {
        console.error("Failed to set up encryption:", error);
        showAlert('Encryption Error', 'Could not set up password protection. Please try again.');
        setAppStatus('SETUP_REQUIRED');
    }
  };
  
  const handleRecoveryPhraseSaved = () => {
    setPendingRecoveryPhrase(null);
    setAppStatus('UNLOCKED');
  };

  const handleUnlock = async (password: string) => {
      const salt = (await db.settings.get('encryptionSalt'))?.value;
      const verifier = (await db.settings.get('encryptionVerifier'))?.value;
      const wrappedMasterKey = (await db.settings.get('wrappedMasterKey'))?.value;

      if (!salt || !verifier || !wrappedMasterKey) {
          showAlert('Error', 'Encryption data is missing. Please reset the app.');
          return false;
      }
      
      try {
          await cryptoService.verifyPasswordAndGetKey(password, salt, wrappedMasterKey, verifier);
          setAppStatus('UNLOCKED');
          return true;
      } catch (error) {
          console.error("Unlock failed:", error);
          return false;
      }
  };

    const handleRecoverAccount = async (phrase: string, newPassword: string): Promise<string | null> => {
        const salt = (await db.settings.get('encryptionSalt'))?.value;
        const wrappedKey = (await db.settings.get('wrappedMasterKeyByRecovery'))?.value;
        const hash = (await db.settings.get('recoveryPhraseHash'))?.value;

        if (!salt || !wrappedKey || !hash) return "Recovery data is missing from the database. Cannot proceed.";

        try {
            const { newWrappedMasterKey } = await cryptoService.recoverAndResetPassword(phrase, newPassword, salt, wrappedKey, hash);
            await db.settings.put({ key: 'wrappedMasterKey', value: newWrappedMasterKey });
            
            // Now, unlock the app with the new password
            await handleUnlock(newPassword);
            setIsRecoverAccountModalOpen(false);
            return null; // Success
        } catch (e: any) {
            return e.message || "An unknown error occurred during recovery.";
        }
    };



  const handleApplyFilters = (newFilter: FilterState) => {
    setFilter(newFilter);
    setIsFilterModalOpen(false);
  };

  const handleResetFilter = useCallback(<K extends keyof FilterState>(key: K) => {
    const defaultsMap: { [T in keyof FilterState]?: FilterState[T] } = {
        period: FilterPeriod.ALL,
        wallet: 'all',
        transactionType: TransactionFilterType.ALL,
    };
    if (key in defaultsMap) {
        setFilter(prev => ({ ...prev, [key]: defaultsMap[key] as FilterState[K] }));
    }
  }, []);

  const handleApplyDebtFilters = (newFilter: DebtFilterState) => {
    setDebtFilter(newFilter);
    setIsDebtFilterModalOpen(false);
  };

  const handleResetDebtFilter = useCallback(<K extends keyof DebtFilterState>(key: K) => {
    const defaultsMap: { [T in keyof DebtFilterState]?: DebtFilterState[T] } = {
        status: DebtFilterStatus.ALL,
        type: DebtFilterType.ALL,
        period: FilterPeriod.ALL,
    };
     if (key in defaultsMap) {
        setDebtFilter(prev => ({ ...prev, [key]: defaultsMap[key] as DebtFilterState[K] }));
    }
  }, []);

  const handleApplyInvestmentFilters = (newFilter: InvestmentFilterState) => {
    setInvestmentFilter(newFilter);
    setIsInvestmentFilterModalOpen(false);
  };

  const handleResetInvestmentFilter = useCallback(<K extends keyof InvestmentFilterState>(key: K) => {
    const defaultsMap: { [T in keyof InvestmentFilterState]?: InvestmentFilterState[T] } = {
        status: InvestmentFilterStatus.ALL,
        type: 'all',
        period: FilterPeriod.ALL,
    };
     if (key in defaultsMap) {
        setInvestmentFilter(prev => ({ ...prev, [key]: defaultsMap[key] as InvestmentFilterState[K] }));
    }
  }, []);

  const handleApplyCashFlowFilters = (newFilter: CashFlowFilterState) => {
    setCashFlowFilter(newFilter);
    setIsCashFlowFilterModalOpen(false);
  };

  const handleResetCashFlowFilter = useCallback(<K extends keyof CashFlowFilterState>(key: K) => {
    const defaultsMap: { [T in keyof CashFlowFilterState]?: CashFlowFilterState[T] } = {
        period: FilterPeriod.ALL,
    };
     if (key in defaultsMap) {
        setCashFlowFilter(prev => ({ ...prev, [key]: defaultsMap[key] as CashFlowFilterState[K] }));
    }
  }, []);
  
  const handleSaveSettings = async (
    newDefaultPeriod: FilterPeriod,
    newWallets: string[],
    newDefaultWallet: string,
    newDeficitThreshold: number
  ) => {
    await db.settings.bulkPut([
      { key: "defaultFilterPeriod", value: newDefaultPeriod },
      { key: "wallets", value: newWallets },
      { key: "defaultWallet", value: newDefaultWallet },
      { key: "deficitThreshold", value: newDeficitThreshold },
    ]);
    setFilter((prev) => ({
      ...prev,
      period: newDefaultPeriod,
      wallet: newDefaultWallet,
    }));
    setIsSettingsModalOpen(false);
  };


  const closeAllModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsDebtFormModalOpen(false);
    setIsDebtInstallmentModalOpen(false);
    setIsSettleModalOpen(false);
    setIsForgiveModalOpen(false);
    setIsInvestmentFormModalOpen(false);
    setIsInvestmentTransactionFormModalOpen(false);
    setIsUpdateValueModalOpen(false);
    setIsSellInvestmentModalOpen(false);
    setIsBulkAddModalOpen(false);
    setIsClearDataModalOpen(false);
    setIsFilterModalOpen(false);
    setIsDebtFilterModalOpen(false);
    setIsInvestmentFilterModalOpen(false);
    setIsCashFlowFilterModalOpen(false);
    setIsRecoverAccountModalOpen(false);
    setEditingTransaction(null);
    setInitialTransactionData(null);
    setItemToDelete(null);
    setEditingDebt(null);
    setSettlingDebt(null);
    setSettlingDebtInstallments(null);
    setDebtForInstallment(null);
    setInstallmentsForDebt(null);
    setEditingInstallment(null);
    setEditingInvestment(null);
    setForgivingDebt(null);
    setEditingInvestmentTransaction(null);
    setAddingTransactionToInvestment(null);
    setUpdatingInvestment(null);
    setSellingInvestment(null);
  };

  const handleQuickAdd = () => {
    switch(activeView) {
      case 'transactions':
      case 'health': // Default to transaction on health tab
        setEditingTransaction(null);
        setInitialTransactionData(null);
        setInitialTransactionType(TransactionType.EXPENSE);
        setIsFormModalOpen(true);
        break;
      case 'debts':
        setEditingDebt(null);
        setInitialDebtType(DebtType.LENT);
        setIsDebtFormModalOpen(true);
        break;
      case 'investments':
        setEditingInvestment(null);
        setIsInvestmentFormModalOpen(true);
        break;
    }
  };

  const handleOpenAddForm = (type: ActionType) => {
    switch(type) {
      case ActionType.TRANSACTION:
        setEditingTransaction(null);
        setInitialTransactionType(TransactionType.EXPENSE);
        setIsFormModalOpen(true);
        break;
      case ActionType.DEBT:
        setEditingDebt(null);
        setInitialDebtType(DebtType.LENT);
        setIsDebtFormModalOpen(true);
        break;
      case ActionType.INVESTMENT:
        setEditingInvestment(null);
        setIsInvestmentFormModalOpen(true);
        break;
    }
  };
  
  const handleOpenEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormModalOpen(true);
  };
  
  const handleOpenEditDebtForm = (debt: Debt) => {
    setEditingDebt(debt);
    setIsDebtFormModalOpen(true);
  };

  const handleOpenEditInvestmentForm = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsInvestmentFormModalOpen(true);
  };

  const handleOpenDeleteModal = (item: Transaction | Debt | DebtInstallment | Investment | InvestmentTransaction) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };
  
  const handleOpenSettleConfirm = (debt: Debt) => {
    setSettlingDebt(debt);
    const installments = debtInstallments.filter((di)=>di.debtId===debt.id);
    setSettlingDebtInstallments(installments);
    setIsSettleModalOpen(true);
  };

  const handleOpenForgiveConfirm = (debt: Debt) => {
    setForgivingDebt(debt);
    setIsForgiveModalOpen(true);
  };

  const handleOpenAddInstallment = (debt: Debt) => {
    setDebtForInstallment(debt);
    const installments = debtInstallments.filter((di)=>di.debtId === debt.id);
    setInstallmentsForDebt(installments);
    setIsDebtInstallmentModalOpen(true);
  };
  const handleOpenEditInstallmentModal = (installment: DebtInstallment) => {
    const debt = debts.find((d)=>d.id === installment.debtId);
    const installments = debtInstallments.filter((di)=>di.debtId === debt.id);
    setInstallmentsForDebt(installments);
    setDebtForInstallment(debt);
    setEditingInstallment(installment);
    setIsDebtInstallmentModalOpen(true);
  }
  
  const handleOpenAddInvestmentTransactionModal = (investmentId: string) => {
    const investment = investments?.find(inv => inv.id === investmentId);
    if (investment) {
        setEditingInvestmentTransaction(null);
        setAddingTransactionToInvestment(investment);
        setIsInvestmentTransactionFormModalOpen(true);
    }
  };
  
  const handleOpenEditInvestmentTransactionModal = (transaction: InvestmentTransaction) => {
    setEditingInvestmentTransaction(transaction);
    setIsInvestmentTransactionFormModalOpen(true);
  };

  const handleOpenUpdateValueModal = (investment: Investment) => {
    setUpdatingInvestment(investment);
    setIsUpdateValueModalOpen(true);
  };

  const handleOpenSellInvestmentModal = (investment: Investment) => {
    setSellingInvestment(investment);
    setIsSellInvestmentModalOpen(true);
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'isReconciliation' | 'transferId'> & { id?: string }) => {
    try {
      await db.transaction('rw', db.transactionItems, db.settings, async () => {
          if (data.id) { // Edit mode
              const txToUpdate = await db.transactionItems.get(data.id);
              if (txToUpdate) {
                  await db.transactionItems.update(data.id, { ...txToUpdate, ...data });
              }
          } else { // Add mode
              if (!appFirstUseDate) {
                  await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
              }
              await db.transactionItems.add({ ...data, id: crypto.randomUUID(), isReconciliation: false });
          }
    });
    closeAllModals();
  }catch(e){
    console.log("Failed to save transaction",e)
  }
  };

  const handleBulkAddTransactions = async (newTransactions: Omit<Transaction, 'id' | 'isReconciliation' | 'transferId'>[]) => {
    await db.transaction('rw', db.transactionItems, db.settings, async () => {
        if (!appFirstUseDate) {
            await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
        }
        const fullTransactions = newTransactions.map(tx => ({
            ...tx,
            id: crypto.randomUUID(),
            isReconciliation: false,
        }));
        if (fullTransactions.length > 0) {
            await db.transactionItems.bulkAdd(fullTransactions);
        }
    });
    setFilter(prev => ({ ...prev, period: FilterPeriod.ALL }));
    closeAllModals();
  };
  
  const handleSaveTransfer = async (data: { amount: number; date: string; fromWallet: string; toWallet: string; description: string }) => {
    await db.transaction('rw', db.transactionItems, db.settings, async () => {
        if (!appFirstUseDate) {
            await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
        }
        const transferId = crypto.randomUUID();
        const { amount, date, fromWallet, toWallet, description } = data;

        const expenseDesc = `Transfer to ${toWallet}${description ? ` (${description})` : ''}`;
        const incomeDesc = `Transfer from ${fromWallet}${description ? ` (${description})` : ''}`;

        const expenseTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: TransactionType.EXPENSE,
            amount,
            date,
            wallet: fromWallet,
            description: expenseDesc,
            isReconciliation: false,
            transferId,
        };

        const incomeTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: TransactionType.INCOME,
            amount,
            date,
            wallet: toWallet,
            description: incomeDesc,
            isReconciliation: false,
            transferId,
        };
        
        await db.transactionItems.bulkAdd([expenseTransaction, incomeTransaction]);
    });
    closeAllModals();
  };

  const handleSaveDebt = async (data: {
    debtData: Omit<Debt, 'id' | 'status'> & { id?: string };
    createTransaction: boolean;
    wallet: string;
  }) => {
    const { debtData, createTransaction, wallet } = data;

    if (debtData.id) { // Edit mode
        await db.transaction('rw', db.debts, db.settings, async () => {
            if (!appFirstUseDate) {
                await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
            }
            await db.debts.update(debtData.id, debtData);
        });
    } else { // Add mode
        
        await db.transaction('rw', db.debts, db.transactionItems, db.settings, async () => {
            if (!appFirstUseDate) {
                await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
            }
            const newDebt: Debt = { ...debtData, id: crypto.randomUUID(), status: DebtStatus.OUTSTANDING };
            await db.debts.add(newDebt);

            if (createTransaction) {
                const newTransaction: Transaction = {
                    id: crypto.randomUUID(),
                    type: debtData.type === DebtType.LENT ? TransactionType.EXPENSE : TransactionType.INCOME,
                    amount: debtData.amount,
                    date: debtData.date,
                    description: debtData.type === DebtType.LENT
                        ? `Loan to ${debtData.person}`
                        : `Loan from ${debtData.person}`,
                    wallet: wallet,
                    debtId: newDebt.id,
                    isReconciliation: false,
                };
                await db.transactionItems.add(newTransaction);
            }
        });
    }
    closeAllModals();
  };

  const handleSaveDebtInstallment = async (data: {
    installmentData: Omit<DebtInstallment, 'id'> & { id?: string };
    createTransaction: boolean;
    markAsSettled: boolean;
    wallet: string;
    createSurplusRecord?: boolean;
  }) => {
    if (!debtForInstallment) return;

    await db.transaction(
      "rw",
      db.debts,
      db.debtInstallements,
      db.transactionItems,
      db.settings,
      async () => {
        const linkedDebt = await db.debts.get(data.installmentData.debtId);
        const allInstallments: DebtInstallment[] = await db.debtInstallements
          .where({ debtId: data.installmentData.debtId })
          .toArray();

        if (data.installmentData.id) {
          // Edit mode
          await db.transaction(
            "rw",
            db.debtInstallements,
            db.transactionItems,
            db.settings,
            async () => {
              if (!appFirstUseDate) {
                await db.settings.put({
                  key: "appFirstUseDate",
                  value: new Date().toISOString(),
                });
              }
              await db.debtInstallements.update(
                data.installmentData.id,
                {...data.installmentData}
              );

              const linkedTransactions = await db.transactionItems.where({
                debtInstallmentId: data.installmentData.id
              }).toArray();

              if (linkedTransactions?.[0]) {
                const linkedTransaction = linkedTransactions[0] as Transaction;
                await db.transactionItems.update(linkedTransaction.id, {
                  ...linkedTransaction,
                  amount: data.installmentData.amount,
                });
              }
            }
          );
        } else {
          // Add mode

          if (!appFirstUseDate) {
            await db.settings.put({
              key: "appFirstUseDate",
              value: new Date().toISOString(),
            });
          }


          const installmentId = crypto.randomUUID()
          const newInstallment: DebtInstallment = {
            ...data.installmentData,
            id: installmentId,
          };

          // 1. Add debt installment transaction
          await db.debtInstallements.add(newInstallment);

          // 2. Create Transaction for the payment
          if (data.createTransaction) {
            const isLent = debtForInstallment.type === DebtType.LENT;
            const newTransaction: Transaction = {
              id: crypto.randomUUID(),
              type: isLent ? TransactionType.INCOME : TransactionType.EXPENSE,
              amount: data.installmentData.amount,
              date: data.installmentData.date,
              description: isLent
                ? `Payment received from ${debtForInstallment.person}`
                : `Payment made to ${debtForInstallment.person}`,
              wallet: data.wallet,
              debtId: debtForInstallment.id,
              isReconciliation: false,
              debtInstallmentId: installmentId
            };
            await db.transactionItems.add(newTransaction);
          }
        }

        // Handle debt status
        const newStatus = data.markAsSettled ? DebtStatus.SETTLED : DebtStatus.OUTSTANDING;
        await db.debts.update(debtForInstallment.id, {
                status: newStatus
        });

        // Handle Surplus (Overpayment) - Create New Debt
        if (data.createSurplusRecord) {
          const paidPreviously = (allInstallments || []).reduce(
            (sum, i) => sum + i.amount,
            0
          );
          const remaining = Math.max(
            0,
            (linkedDebt?.amount || 0) - paidPreviously
          );
          const surplusAmount = Math.max(
            0,
            data.installmentData.amount - remaining
          );

          if (surplusAmount > 0) {
            const isOriginalLent = debtForInstallment.type === DebtType.LENT;
            const newDebtType = isOriginalLent ? DebtType.OWED : DebtType.LENT; // Inverse

            const newDebt: Debt = {
              id: crypto.randomUUID(),
              type: newDebtType,
              person: debtForInstallment.person,
              amount: surplusAmount,
              description: `Overpayment from previous ${
                isOriginalLent ? "loan" : "debt"
              } settlement`,
              date: data.installmentData.date,
              status: DebtStatus.OUTSTANDING,
            };
            await db.debts.add(newDebt);
          }
        }
      }
    );
    closeAllModals();
  };
  
  const handleSaveInvestment = async (data: {
    investmentData: Omit<Investment, 'id' | 'status' | 'currentValue'> & { id?: string };
    initialContribution?: number;
    currentValue?: number;
    createTransaction?: boolean;
    wallet?: string;
  }) => {
    const { investmentData, initialContribution, currentValue, createTransaction, wallet } = data;
    

    if (investmentData.id) { // Edit mode
        await db.transaction('rw', db.investments, db.settings, async () => {
            if (!appFirstUseDate) {
                await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
            }
            await db.investments.update(investmentData.id, investmentData);
        });
        closeAllModals();
    } else { // Add mode
        const contributionAmount = initialContribution || 0;
        
        await db.transaction('rw', db.investments, db.investmentTransactions, db.transactionItems, db.settings, async () => {
            if (!appFirstUseDate) {
                await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
            }
            const newInvestment: Investment = { 
                ...investmentData, 
                id: crypto.randomUUID(), 
                status: InvestmentStatus.ACTIVE,
                currentValue: currentValue ?? contributionAmount,
            };
            await db.investments.add(newInvestment);
            
            if (contributionAmount > 0) {
                const investmentTx: InvestmentTransaction = {
                    id: crypto.randomUUID(),
                    investmentId: newInvestment.id,
                    type: InvestmentTransactionType.CONTRIBUTION,
                    date: investmentData.startDate,
                    amount: contributionAmount,
                };
                await db.investmentTransactions.add(investmentTx);
                
                if (createTransaction && wallet) {
                    const newTransaction: Transaction = {
                        id: crypto.randomUUID(),
                        type: TransactionType.EXPENSE,
                        amount: contributionAmount,
                        date: investmentData.startDate,
                        description: `Investment: ${investmentData.name}`,
                        wallet: wallet,
                        investmentTransactionId: investmentTx.id,
                        isReconciliation: false,
                    };
                    await db.transactionItems.add(newTransaction);
                }
            }
        });
        closeAllModals();
    }
  };

  const handleSaveInvestmentTransaction = async (data: {
    transactionData: Omit<InvestmentTransaction, 'id'> & { id?: string };
    createTransaction: boolean;
    wallet: string;
  }) => {
    const { transactionData, createTransaction, wallet } = data;

    if (transactionData.id) { // Edit mode
        await db.transaction('rw', db.investmentTransactions, db.settings, async () => {
            if (!appFirstUseDate) {
                await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
            }
            await db.investmentTransactions.update(transactionData.id, transactionData);
        });
    } else { // Add mode

        await db.transaction('rw', db.investmentTransactions, db.transactionItems, db.settings, async () => {
            if (!appFirstUseDate) {
                await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
            }
            const newInvestmentTx: InvestmentTransaction = { ...transactionData, id: crypto.randomUUID() };
            await db.investmentTransactions.add(newInvestmentTx);

            if (createTransaction) {
                let transactionType: TransactionType;
                let description = '';
                const invName = investments?.find(i => i.id === transactionData.investmentId)?.name || 'Unknown Investment';

                switch (transactionData.type) {
                    case InvestmentTransactionType.CONTRIBUTION:
                        transactionType = TransactionType.EXPENSE;
                        description = `Investment Top-up: ${invName}`;
                        break;
                    case InvestmentTransactionType.WITHDRAWAL:
                        transactionType = TransactionType.INCOME;
                        description = `Investment Withdrawal: ${invName}`;
                        break;
                    case InvestmentTransactionType.DIVIDEND:
                    default:
                        transactionType = TransactionType.INCOME;
                        description = `Dividend: ${invName}`;
                        break;
                }

                const newTransaction: Transaction = {
                    id: crypto.randomUUID(),
                    type: transactionType,
                    amount: transactionData.amount,
                    date: transactionData.date,
                    description,
                    wallet: wallet,
                    investmentTransactionId: newInvestmentTx.id,
                    isReconciliation: false,
                };
                await db.transactionItems.add(newTransaction);
            }
        });
    }
    closeAllModals();
  };


  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    let itemType = 'transaction';
    if ('person' in itemToDelete) itemType = 'debt';
    else if ('investmentId' in itemToDelete) itemType = 'investment_transaction';
    else if ('startDate' in itemToDelete) itemType = 'investment';
    else if ('debtId' in itemToDelete ) itemType = 'installment'
    

    if ('person' in itemToDelete) { // Debt
        // Ensure installments are included in the same transaction to avoid
        // multiple transactions that can cause liveQuery to emit intermediate states.
        await db.transaction('rw', [db.transactionItems, db.debts, db.debtInstallements], async () => {
            await db.transactionItems.where({ debtId: itemToDelete.id }).delete();
            await db.debtInstallements.where({debtId: itemToDelete.id}).delete();
            await db.debts.delete(itemToDelete.id);
        });
    } else if ('investmentId' in itemToDelete) { // InvestmentTransaction
        const txToDelete = itemToDelete as InvestmentTransaction;
        await db.transaction('rw', db.investmentTransactions, db.transactionItems, async () => {
            await db.investmentTransactions.delete(txToDelete.id);
            await db.transactionItems.where({ investmentTransactionId: txToDelete.id }).delete();
        });
    } else if ('startDate' in itemToDelete) { // Investment
        await db.transaction('rw', db.investments, db.investmentTransactions, db.transactionItems, async () => {
            const investmentIdToDelete = itemToDelete.id;
            const childInvTxs = await db.investmentTransactions.where({ investmentId: investmentIdToDelete }).toArray();
            const childInvTxIds = childInvTxs.map((tx: any) => tx.id);
            
            await db.investments.delete(investmentIdToDelete);
            if (childInvTxs.length > 0) {
                await db.investmentTransactions.bulkDelete(childInvTxIds);
                await db.transactionItems.where('investmentTransactionId').anyOf(childInvTxIds).delete();
            }
        });
    } else if ('debtId' in itemToDelete  && !('debtInstallmentId' in itemToDelete)){ // Installment
        const installment = itemToDelete as DebtInstallment;
        await db.transaction(
          "rw",
          db.debtInstallements,
          db.transactionItems,
          async () => {
            await db.debtInstallements.delete(installment.id);
            await db.transactionItems.where({
              debtInstallmentId: installment.id
            }).delete()
          }
        );
    } else { // Transaction
        const transactionToDelete = itemToDelete as Transaction;
        if (transactionToDelete.transferId) {
            const transferId = transactionToDelete.transferId;
            const txsToDelete = await db.transactionItems.where({ transferId }).toArray();
            const idsToDelete = txsToDelete.map((tx: any) => tx.id);
            setAnimatingOutIds(prev => [...new Set([...prev, ...idsToDelete])]);
            setTimeout(async () => {
                await db.transactionItems.where({ transferId }).delete();
                setAnimatingOutIds(prev => prev.filter(id => !idsToDelete.includes(id)));
            }, 300);
        } else {
             const idToDelete = transactionToDelete.id;
            setAnimatingOutIds(prev => [...prev, idToDelete]);
            setTimeout(async () => {
                // For simple transactions, or those linked to debts/investments where
                // the parent item is NOT deleted, just delete the transaction itself.
                // The atomic logic for deleting parents is handled when deleting the parent item.
                await db.transactionItems.delete(idToDelete);
                setAnimatingOutIds(prev => prev.filter(id => id !== idToDelete));
            }, 300);
        }
    }
    
    closeAllModals();
  };
  
  const handleSettleDebt = async (data: { settlementDate: string; createTransaction: boolean; wallet: string }) => {
    if (!settlingDebt) return;

    await db.transaction('rw', db.transactionItems, db.debts, db.debtInstallements, async () => {

        // Calculate remaining amount based on installments
        const installments = await db.debtInstallements.where({
          debtId: settlingDebt.id
        }).toArray();
        const paidAmount = (installments || []).reduce((sum, inst) => sum + inst.amount, 0);
        const remainingAmount = settlingDebt.amount - paidAmount;



        // Create a final settlement installment
        const finalInstallment: DebtInstallment = {
          amount: remainingAmount,
          date: data.settlementDate,
          debtId: settlingDebt.id,
          id: crypto.randomUUID(),
          note: 'Final installment/ இறுதி தவணை'
        }
        await db.debtInstallements.add(finalInstallment);
  
        if (data.createTransaction && remainingAmount > 0) {
            const newTransaction: Transaction = {
                id: crypto.randomUUID(),
                type: settlingDebt.type === DebtType.LENT ? TransactionType.INCOME : TransactionType.EXPENSE,
                amount: remainingAmount,
                date: data.settlementDate,
                description: settlingDebt.type === DebtType.LENT 
                    ? `Settled debt from ${settlingDebt.person}` 
                    : `Paid back debt to ${settlingDebt.person}`,
                wallet: data.wallet,
                debtId: settlingDebt.id,
                isReconciliation: false,
                debtInstallmentId: finalInstallment.id
            };
            await db.transactionItems.add(newTransaction);
        }
        await db.debts.update(settlingDebt.id, { status: DebtStatus.SETTLED });
    });
    
    closeAllModals();
  };

  const handleForgiveDebt = async () => {
    if (!forgivingDebt) return;

    await db.debts.update(forgivingDebt.id, { status: DebtStatus.WAIVED });
    closeAllModals();
  };

  const handleUpdateInvestmentValue = async (newValue: number) => {
    if (!updatingInvestment) return;
    await db.transaction('rw', db.investments, db.settings, async () => {
      if (!appFirstUseDate) {
        await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
      }
      await db.investments.update(updatingInvestment.id, { currentValue: newValue });
    });
    closeAllModals();
  };

  const handleSellInvestment = async (data: { wallet: string; createTransaction: boolean; sellDate: string }) => {
    if (!sellingInvestment) return;

    await db.transaction('rw', db.investmentTransactions, db.transactionItems, db.investments, async () => {
        const finalWithdrawal: InvestmentTransaction = {
            id: crypto.randomUUID(),
            investmentId: sellingInvestment.id,
            type: InvestmentTransactionType.WITHDRAWAL,
            date: data.sellDate,
            amount: sellingInvestment.currentValue,
            notes: "Full sale of investment",
        };
        await db.investmentTransactions.add(finalWithdrawal);

        if (data.createTransaction) {
            const newTransaction: Transaction = {
                id: crypto.randomUUID(),
                type: TransactionType.INCOME,
                amount: sellingInvestment.currentValue,
                date: data.sellDate,
                description: `Sold investment: ${sellingInvestment.name}`,
                wallet: data.wallet,
                investmentTransactionId: finalWithdrawal.id,
                isReconciliation: false,
            };
            await db.transactionItems.add(newTransaction);
        }

        await db.investments.update(sellingInvestment.id, { status: InvestmentStatus.SOLD });
    });
    
    closeAllModals();
  };
  
  const handleOpenClearDataModal = () => {
    setIsSettingsModalOpen(false);
    setIsClearDataModalOpen(true);
  };

  const handleRequestResetFromRecovery = () => {
    setIsRecoverAccountModalOpen(false);
    setIsClearDataModalOpen(true);
  };

  const handleClearAllData = async () => {
    cryptoService.clearKey();
    await db.delete();
    await db.open();
    setAppStatus('SETUP_REQUIRED');
    closeAllModals();
  };

  const {
    filteredTransactions,
    periodicIncome,
    periodicExpense,
    projectedPeriodicIncome,
    projectedPeriodicExpense,
  } = useMemo(() => {
    if (!transactions) return { filteredTransactions: [], periodicIncome: 0, periodicExpense: 0, projectedPeriodicIncome: 0, projectedPeriodicExpense: 0 };
    
    let periodStartDate: Date;
    let periodEndDate: Date;

    switch (filter.period) {
      case FilterPeriod.TODAY: {
        periodStartDate = new Date(today);
        periodStartDate.setHours(0, 0, 0, 0);
        periodEndDate = new Date(today);
        break;
      }
      case FilterPeriod.THIS_MONTH: {
        periodStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        periodEndDate = new Date(today);
        break;
      }
      case FilterPeriod.LAST_MONTH: {
        periodStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        periodEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        periodEndDate.setHours(23, 59, 59, 999);
        break;
      }
      case FilterPeriod.CUSTOM: {
        periodStartDate = new Date(filter.startDate + 'T00:00:00');
        periodEndDate = new Date(filter.endDate + 'T23:59:59');
        break;
      }
      case FilterPeriod.ALL:
      default:
        periodStartDate = new Date(0);
        periodEndDate = new Date('9999-12-31T23:59:59.999Z');
        break;
    }

    let income = 0;
    let expense = 0;
    let projIncome = 0;
    let projExpense = 0;
    let overallOpIncome = 0;
    let overallOpExpense = 0;
    const periodTransactions: Transaction[] = [];
    
    transactions.forEach(tx => {
      // 1. Filter for List View and Periodic Stats
      const txDate = new Date(tx.date + 'T00:00:00');

      const walletMatch = filter.wallet === 'all' || tx.wallet === filter.wallet;
      if (!walletMatch) return;

      if (txDate >= periodStartDate && txDate <= periodEndDate) {
        periodTransactions.push(tx);
        if (tx.isReconciliation || (filter.wallet === 'all' && tx.transferId)) return;
        
        if (tx.type === TransactionType.INCOME) {
            projIncome += tx.amount;
            if (txDate <= today) income += tx.amount;
        } else {
            projExpense += tx.amount;
            if (txDate <= today) expense += tx.amount;
        }
      }
    });

    const finalFilteredTransactions = periodTransactions.filter(tx => {
      switch (filter.transactionType) {
        case TransactionFilterType.INCOME: return tx.type === TransactionType.INCOME && !tx.transferId && !tx.isReconciliation;
        case TransactionFilterType.EXPENSE: return tx.type === TransactionType.EXPENSE && !tx.transferId && !tx.isReconciliation;
        case TransactionFilterType.TRANSFER: return !!tx.transferId;
        case TransactionFilterType.ADJUSTMENT: return tx.isReconciliation;
        default: return true;
      }
    });

    return { 
        filteredTransactions: finalFilteredTransactions, 
        periodicIncome: income, 
        periodicExpense: expense, 
        projectedPeriodicIncome: projIncome, 
        projectedPeriodicExpense: projExpense,
    };
  }, [transactions, filter, today]);

  const {
    periodicOperationalIncome,
    periodicOperationalExpense,
  } = useMemo(() => {
    if (!transactions) return { periodicOperationalIncome: 0, periodicOperationalExpense: 0 };
    
    let periodStartDate: Date;
    let periodEndDate: Date;

    // 1. Define the Period Window
    switch (cashFlowFilter.period) {
      case FilterPeriod.TODAY: {
        periodStartDate = new Date(today);
        periodStartDate.setHours(0, 0, 0, 0);
        periodEndDate = new Date(today);
        periodEndDate.setHours(23, 59, 59, 999);
        break;
      }
      case FilterPeriod.THIS_MONTH: {
        periodStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        // We cap the end date at 'today' to automatically exclude future transactions
        periodEndDate = new Date(today); 
        periodEndDate.setHours(23, 59, 59, 999);
        break;
      }
      case FilterPeriod.LAST_MONTH: {
        periodStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        periodEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        periodEndDate.setHours(23, 59, 59, 999);
        break;
      }
      case FilterPeriod.CUSTOM: {
        periodStartDate = new Date(filter.startDate + 'T00:00:00');
        periodEndDate = new Date(filter.endDate + 'T23:59:59');
        break;
      }
      case FilterPeriod.ALL:
      default:
        periodStartDate = new Date(0);
        periodEndDate = new Date(today); // Cap 'All' at today as well
        periodEndDate.setHours(23, 59, 59, 999);
        break;
    }

    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
      // 3. Filter Operational Types (Exclude irrelevant types)
      if (
        tx.isReconciliation || 
        tx.transferId || 
        tx.debtId || 
        tx.investmentTransactionId
      ) return;

      const txDate = new Date(tx.date + 'T00:00:00');

      // 4. Strict Date Check
      // We check if it is within the period AND strictly in the past/present
      if (txDate >= periodStartDate && txDate <= periodEndDate && txDate <= today) {
        if (tx.type === TransactionType.INCOME) {
            income += tx.amount;
        } else {
            expense += tx.amount;
        }
      }
    });

    return {
        periodicOperationalIncome: income,
        periodicOperationalExpense: expense 
    };
  }, [cashFlowFilter, transactions, today]);
  
  

  const { currentBalance, projectedBalance, globalBalance } = useMemo(() => {
    if (!transactions)
      return { currentBalance: 0, projectedBalance: 0, globalBalance: 0 };

    let current = 0;
    let projected = 0;
    let global = 0;

    const relevantTransactions =
      filter.wallet === "all"
        ? transactions
        : transactions.filter((tx) => tx.wallet === filter.wallet);

    relevantTransactions.forEach((tx) => {
      const txDate = new Date(tx.date + "T00:00:00");
      const amount =
        tx.type === TransactionType.INCOME ? tx.amount : -tx.amount;
      projected += amount;
      if (txDate <= today) current += amount;
    });

    // Calculate global balance (all wallets) for Health check
    transactions.forEach((tx) => {
      const txDate = new Date(tx.date + "T00:00:00");
      if (txDate <= today) {
        const amount =
          tx.type === TransactionType.INCOME ? tx.amount : -tx.amount;
        global += amount;
      }
    });

    return {
      currentBalance: current,
      projectedBalance: projected,
      globalBalance: global,
    };
  }, [transactions, filter.wallet, today]);

  const filteredDebts = useMemo(() => {
    if (!debts) return [];
    
    let periodStartDate: Date;
    let periodEndDate: Date;

    switch (debtFilter.period) {
        case FilterPeriod.TODAY:
            periodStartDate = new Date(today);
            periodStartDate.setHours(0, 0, 0, 0);
            periodEndDate = new Date(today);
            break;
        case FilterPeriod.THIS_MONTH:
            periodStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
            periodEndDate = new Date(today);
            break;
        case FilterPeriod.LAST_MONTH:
            periodStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            periodEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
            periodEndDate.setHours(23, 59, 59, 999);
            break;
        case FilterPeriod.CUSTOM:
            periodStartDate = new Date(debtFilter.startDate + 'T00:00:00');
            periodEndDate = new Date(debtFilter.endDate + 'T23:59:59');
            break;
        case FilterPeriod.ALL:
        default:
            periodStartDate = new Date(0);
            periodEndDate = new Date('9999-12-31T23:59:59.999Z');
            break;
    }

    return debts.filter(debt => {
        const statusMatch = debtFilter.status === DebtFilterStatus.ALL || (debt.status as string) === debtFilter.status;
        const typeMatch = debtFilter.type === DebtFilterType.ALL || (debt.type as string) === debtFilter.type;
        const debtDate = new Date(debt.date + 'T00:00:00');
        const dateMatch = debtDate >= periodStartDate && debtDate <= periodEndDate;
        return statusMatch && typeMatch && dateMatch;
    });
  }, [debts, debtFilter, today]);

  const { totalLent, totalOwed } = useMemo(() => {
    if (!debts) return { totalLent: 0, totalOwed: 0 };
    return debts.reduce( (acc, debt) => {
            if(debt.status === DebtStatus.OUTSTANDING) {
                // For installments, we subtract the paid amount from the total
                const installments = debtInstallments?.filter((di)=>di.debtId === debt.id)
                const paid = (installments || []).reduce((sum, inst) => sum + inst.amount, 0);
                const remaining = Math.max(0, debt.amount - paid);
                
                if (debt.type === DebtType.LENT) acc.totalLent += remaining;
                else acc.totalOwed += remaining;
            }
            return acc;
        }, { totalLent: 0, totalOwed: 0 }
    );
  }, [debts, debtInstallments]);

  const uniqueInvestmentTypes = useMemo(() => {
    if (!investments) return [];
    const types = new Set(investments.map(inv => inv.type));
    return Array.from(types).sort();
  }, [investments]);
  
  const filteredInvestments = useMemo(() => {
    if (!investments) return [];

    let periodStartDate: Date;
    let periodEndDate: Date;

    switch (investmentFilter.period) {
        case FilterPeriod.TODAY:
            periodStartDate = new Date(today);
            periodStartDate.setHours(0, 0, 0, 0);
            periodEndDate = new Date(today);
            break;
        case FilterPeriod.THIS_MONTH:
            periodStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
            periodEndDate = new Date(today);
            break;
        case FilterPeriod.LAST_MONTH:
            periodStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            periodEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
            periodEndDate.setHours(23, 59, 59, 999);
            break;
        case FilterPeriod.CUSTOM:
            periodStartDate = new Date(investmentFilter.startDate + 'T00:00:00');
            periodEndDate = new Date(investmentFilter.endDate + 'T23:59:59');
            break;
        case FilterPeriod.ALL:
        default:
            periodStartDate = new Date(0);
            periodEndDate = new Date('9999-12-31T23:59:59.999Z');
            break;
    }

    return investments.filter(inv => {
        const statusMatch = investmentFilter.status === InvestmentFilterStatus.ALL || (inv.status as string) === investmentFilter.status;
        const typeMatch = investmentFilter.type === 'all' || inv.type === investmentFilter.type;
        const invDate = new Date(inv.startDate + 'T00:00:00');
        const dateMatch = invDate >= periodStartDate && invDate <= periodEndDate;
        return statusMatch && typeMatch && dateMatch;
    });
  }, [investments, investmentFilter, today]);
  
  const { totalInvested, currentPortfolioValue } = useMemo(() => {
    if (!investments || !investmentTransactions) return { totalInvested: 0, currentPortfolioValue: 0 };

    const investmentNetContributions = investmentTransactions.reduce<Record<string, number>>((acc, tx) => {
        if (!acc[tx.investmentId]) acc[tx.investmentId] = 0;
        if (tx.type === InvestmentTransactionType.CONTRIBUTION) acc[tx.investmentId] += Number(tx.amount) || 0;
        else if (tx.type === InvestmentTransactionType.WITHDRAWAL) acc[tx.investmentId] -= Number(tx.amount) || 0;
        return acc;
    }, {});
    
    return investments.reduce((acc, inv) => {
        if (inv.status === InvestmentStatus.ACTIVE) {
            acc.totalInvested += (investmentNetContributions[inv.id] || 0);
            acc.currentPortfolioValue += Number(inv.currentValue) || 0;
        }
        return acc;
    }, { totalInvested: 0, currentPortfolioValue: 0 });
  }, [investments, investmentTransactions]);

  const handleReconcile = async (actualBalance: number) => {
    const difference = actualBalance - currentBalance;

    if (Math.abs(difference) < 0.01) {
        setIsReconcileModalOpen(false);
        return;
    }

    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: difference > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
        amount: Math.abs(difference),
        date: getLocalDateString(),
        description: "Balance Adjustment",
        isReconciliation: true,
        wallet: filter.wallet !== 'all' ? filter.wallet : wallets[0] || 'Default',
    };

    await db.transaction('rw', db.transactionItems, db.settings, async () => {
        if (!appFirstUseDate) {
            await db.settings.put({ key: 'appFirstUseDate', value: new Date().toISOString() });
        }
        await db.transactionItems.add(newTransaction);
    });

    setIsReconcileModalOpen(false);
};

  const handleExport = async (view: ActiveView) => {
    let transactionCSV = '', debtCSV = '', debtInstallmentsCSV = '', investmentCSV = '', investmentTransactionsCSV = '';
    let hasData = false;

    switch(view) {
      case 'transactions':
        transactionCSV = generateTransactionsCSV(filteredTransactions);
        if (transactionCSV) hasData = true;
        break;
      case 'debts':
        debtCSV = generateDebtsCSV(filteredDebts);
        const relevantDebtIds = new Set(filteredDebts.map(i => i.id));
        const installmentsToExport = debtInstallments?.filter(i => relevantDebtIds.has(i.debtId)) || [];
        debtInstallmentsCSV = generateDebtInstallmentsCSV(installmentsToExport);
        if (debtCSV || debtInstallmentsCSV) hasData = true;
        break;
      case 'investments':
        investmentCSV = generateInvestmentsCSV(filteredInvestments);
        const relevantInvIds = new Set(filteredInvestments.map(i => i.id));
        const txsToExport = investmentTransactions?.filter(tx => relevantInvIds.has(tx.investmentId)) || [];
        investmentTransactionsCSV = generateInvestmentTransactionsCSV(txsToExport);
        if (investmentCSV || investmentTransactionsCSV) hasData = true;
        break;
    }

    if (!hasData) {
        showAlert('No Data to Export', 'There is no data in the current view to export.');
        return;
    }

    try {
        await exportToZip({ transactionCSV, debtCSV, debtInstallmentsCSV,investmentCSV, investmentTransactionsCSV });
    } catch(e) {
        showAlert('Export Error', 'Could not export data. See the browser console for details.');
        console.error(e);
    }
  };
  
  const handleExportAllData = async () => {
    const transactionCSV = generateTransactionsCSV(transactions || []);
    const debtCSV = generateDebtsCSV(debts || []);
    const debtInstallmentsCSV = generateDebtInstallmentsCSV(debtInstallments || []);
    const investmentCSV = generateInvestmentsCSV(investments || []);
    const investmentTransactionsCSV = generateInvestmentTransactionsCSV(investmentTransactions || []);
    
    const hasData = transactionCSV || debtCSV || debtInstallmentsCSV || investmentCSV || investmentTransactionsCSV;

    if (!hasData) {
        showAlert('No Data to Export', 'There is no data to export.');
        return;
    }

    try {
        await exportToZip({ transactionCSV, debtCSV, debtInstallmentsCSV, investmentCSV, investmentTransactionsCSV });
        // Update last backup date on successful export
        await db.settings.put({ key: 'lastBackupDate', value: new Date().toISOString() });
        setBackupReminder({ show: false, days: null });
    } catch (e) {
        showAlert('Export Error', 'Could not export data. See the browser console for details.');
        console.error(e);
    }
  };
  
  const handleImportData = async (file: File) => {
    setIsSettingsModalOpen(false);
    
    try {
        const files = await readZip(file);
        
        const { successful: importedTransactions, errors: txErrors } = files['transactions.csv'] ? parseTransactionsCSV(files['transactions.csv']) : { successful: [], errors: [] };
        const { successful: importedDebts, errors: debtErrors } = files['debts.csv'] ? parseDebtsCSV(files['debts.csv']) : { successful: [], errors: [] };
        const { successful: importedDebtInstallments, errors: debtInstallmentErrors } = files['debtInstallments.csv'] ? parseDebtInstallmentsCSV(files['debtInstallments.csv']) : { successful: [], errors: [] };
        const { successful: importedInvestments, errors: invErrors } = files['investments.csv'] ? parseInvestmentsCSV(files['investments.csv']) : { successful: [], errors: [] };
        const { successful: importedInvestmentTxs, errors: invTxErrors } = files['investment_transactions.csv'] ? parseInvestmentTransactionsCSV(files['investment_transactions.csv']) : { successful: [], errors: [] };

        const allParseErrors = [...txErrors, ...debtErrors, ...debtInstallmentErrors, ...invErrors, ...invTxErrors];

        // Data integrity check: Ensure investment transactions have a valid parent.
        const existingInvestmentIds = new Set((await db.investments.toArray()).map(i => i.id));
        const importedInvestmentIds = new Set(importedInvestments.map(i => i.id));
        const allValidInvestmentIds = new Set([...existingInvestmentIds, ...importedInvestmentIds]);
        
        const validInvestmentTxs: InvestmentTransaction[] = [];
        const orphanedInvestmentTxErrors: ParseError[] = [];

        importedInvestmentTxs.forEach(tx => {
            if (allValidInvestmentIds.has(tx.investmentId)) {
                validInvestmentTxs.push(tx);
            } else {
                orphanedInvestmentTxErrors.push({
                    originalRow: [tx.id, tx.investmentId, tx.type, tx.date, String(tx.amount), tx.notes || ''],
                    message: `Orphaned transaction: No matching Investment found for ID.`,
                });
            }
        });
        
        const allErrors = [...allParseErrors, ...orphanedInvestmentTxErrors];

        // Fix: Pass tables as an array to db.transaction and add type to summary
        const summary: ImportResultSummary = await db.transaction<ImportResultSummary>('rw', [db.transactionItems, db.debts, db.debtInstallements, db.investments, db.investmentTransactions, db.settings], async () => {
            const resultSummary: ImportResultSummary = {
                tx: { added: 0, updated: 0 },
                debt: { added: 0, updated: 0 },
                debtInst: {added: 0, updated: 0 },
                inv: { added: 0, updated: 0 },
                invTx: { added: 0, updated: 0 }
            };

            // Process Investments
            if (importedInvestments.length > 0) {
                const existingInvIds = new Set(await db.investments.where('id').anyOf(importedInvestments.map(i => i.id)).primaryKeys());
                importedInvestments.forEach(inv => {
                    if (existingInvIds.has(inv.id)) resultSummary.inv.updated++;
                    else resultSummary.inv.added++;
                });
                await db.investments.bulkPut(importedInvestments);
            }

            // Process Investment Transactions (only valid ones)
            if (validInvestmentTxs.length > 0) {
                const existingInvTxIds = new Set(await db.investmentTransactions.where('id').anyOf(validInvestmentTxs.map(i => i.id)).primaryKeys());
                validInvestmentTxs.forEach(tx => {
                    if (existingInvTxIds.has(tx.id)) resultSummary.invTx.updated++;
                    else resultSummary.invTx.added++;
                });
                await db.investmentTransactions.bulkPut(validInvestmentTxs);
            }

            // Process Transactions
            if (importedTransactions.length > 0) {
                const existingTxIds = new Set(await db.transactionItems.where('id').anyOf(importedTransactions.map(i => i.id)).primaryKeys());
                importedTransactions.forEach(tx => {
                    if (existingTxIds.has(tx.id)) resultSummary.tx.updated++;
                    else resultSummary.tx.added++;
                });
                await db.transactionItems.bulkPut(importedTransactions);
            }

            // Process Debts
            if (importedDebts.length > 0) {
                const existingDebtIds = new Set(await db.debts.where('id').anyOf(importedDebts.map(i => i.id)).primaryKeys());
                importedDebts.forEach(debt => {
                    if (existingDebtIds.has(debt.id)) resultSummary.debt.updated++;
                    else resultSummary.debt.added++;
                });
                await db.debts.bulkPut(importedDebts);
            }

            if (importedDebtInstallments.length > 0) {
              const existingDebtInstallMentIds = new Set(
                await db.debtInstallements
                  .where("id")
                  .anyOf(importedDebtInstallments.map((i) => i.id))
                  .primaryKeys()
              );
              importedDebtInstallments.forEach((di) => {
                if (existingDebtInstallMentIds.has(di.id))
                  resultSummary.debtInst.updated++;
                else resultSummary.debtInst.added++;
              });
              await db.debtInstallements.bulkPut(importedDebtInstallments)
            }
            
            return resultSummary;
        });



        // This ensures the user sees the newly imported data immediately.
        setFilter(prev => ({ ...prev, period: FilterPeriod.ALL, transactionType: TransactionFilterType.ALL, wallet: 'all' }));
        setDebtFilter(prev => ({ ...prev, period: FilterPeriod.ALL, status: DebtFilterStatus.ALL, type: DebtFilterType.ALL }));
        setInvestmentFilter(prev => ({ ...prev, period: FilterPeriod.ALL, status: InvestmentFilterStatus.ALL, type: 'all' }));

        // Fix: Correctly spread summary object
        setImportSummaryModal({ isOpen: true, summary: { ...summary, errors: allErrors } });

    } catch (e) {
        setImportSummaryModal({ 
            isOpen: true, 
            summary: { 
                tx: { added: 0, updated: 0 }, debt: { added: 0, updated: 0 }, inv: { added: 0, updated: 0 }, invTx: { added: 0, updated: 0 }, errors: [],
                error: "Import failed. Please make sure you are using a valid .zip file exported from this app. See the browser console for more details."
            }
        });
        console.error("Import error:", e);
    }
  };

  const handleOnboardingComplete = () => {
    db.settings.put({ key: 'onboardingCompleted', value: true });
    setShowOnboarding(false);
  };
  
  const handleShowOnboarding = () => {
    setIsSettingsModalOpen(false);
    setShowOnboarding(true);
  };

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
  };
  
  const handleDismissBackupReminder = async () => {
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 3); // Dismiss for 3 days
    await db.settings.put({ key: 'backupReminderDismissedUntil', value: dismissUntil.toISOString() });
    setBackupReminder({ show: false, days: null });
  };

  const isLoading = appStatus === 'UNLOCKED' && (transactions === undefined || debts === undefined || investments === undefined || investmentTransactions === undefined || settingsArray === undefined);
  
  if (appStatus === 'LOADING' || appStatus === 'MIGRATING') {
    return <FullScreenLoader message={appStatus === 'MIGRATING' ? 'Securing your data...' : 'Loading...'} />;
  }
  
  if (pendingRecoveryPhrase) {
      return <RecoveryPhraseModal phrase={pendingRecoveryPhrase} onConfirm={handleRecoveryPhraseSaved} />
  }

  if (appStatus === 'SETUP_REQUIRED') {
      return <PasswordSetupModal onPasswordSet={handlePasswordSet} />;
  }

  if (appStatus === 'LOCKED') {
      return (
        <>
            <UnlockModal onUnlock={handleUnlock} onReset={handleClearAllData} onRecoverRequest={() => setIsRecoverAccountModalOpen(true)} />
            {isRecoverAccountModalOpen && <RecoverAccountModal onRecover={handleRecoverAccount} onClose={() => setIsRecoverAccountModalOpen(false)} onRequestReset={handleRequestResetFromRecovery} />}
            {isClearDataModalOpen && (
              <ClearDataConfirmationModal
                  isOpen={isClearDataModalOpen}
                  onClose={closeAllModals}
                  onConfirm={handleClearAllData}
              />
            )}
        </>
      );
  }

  if (isLoading) {
    return <FullScreenLoader message="Loading data..." />;
  }
  
  const TabButton: FC<{view: ActiveView, label: string}> = ({view, label}) => (
    <button
        onClick={() => handleViewChange(view)}
        className={`w-full py-2.5 text-sm font-semibold leading-5 rounded-lg transition-colors duration-200
            focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 dark:ring-offset-slate-900 ring-white dark:ring-slate-700 ring-opacity-60
            ${activeView === view
                ? 'bg-white dark:bg-slate-700/80 shadow text-indigo-700 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/[0.5] dark:hover:bg-slate-900/[0.2]'
            }`}
    >
        {label}
    </button>
  );

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      {(showOnboarding || !onboardingCompleted) && (
        <OnboardingGuide onComplete={handleOnboardingComplete} isRerunnable={showOnboarding} />
      )}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">i8·e10</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">வரவு செலவு கணக்கு | Personal Finance Tracker</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 transition-colors duration-200"
              aria-label="Open settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.573-1.066z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full px-2 pb-4 sm:px-0">
                <div className="flex space-x-1 rounded-xl bg-blue-900/10 dark:bg-blue-900/20 p-1">
                    <TabButton view="transactions" label="Transactions" />
                    <TabButton view="debts" label="Debts" />
                    <TabButton view="investments" label="Investments" />
                    <TabButton view="health" label="Health" />
                </div>
            </div>
        </div>
      </header>
       {backupReminder.show && (
        <BackupReminderBanner
            daysSinceLastBackup={backupReminder.days}
            onBackup={handleExportAllData}
            onDismiss={handleDismissBackupReminder}
        />
       )}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'transactions' && (
            <>
                <BalanceSummary 
                  currentBalance={currentBalance}
                  projectedBalance={projectedBalance}
                  periodicIncome={periodicIncome} 
                  periodicExpense={periodicExpense}
                  projectedPeriodicIncome={projectedPeriodicIncome}
                  projectedPeriodicExpense={projectedPeriodicExpense}
                  onReconcileClick={() => setIsReconcileModalOpen(true)}
                  filterPeriod={filter.period}
                  walletName={filter.wallet === 'all' ? 'All Wallets' : filter.wallet}
                />
                <FilterControls
                  filter={filter}
                  onOpenModal={() => setIsFilterModalOpen(true)}
                  onResetFilter={handleResetFilter}
                  defaultPeriod={defaultFilterPeriod}
                />
                <TransactionList
                  transactions={filteredTransactions}
                  onEdit={handleOpenEditForm}
                  onDelete={handleOpenDeleteModal}
                  animatingOutIds={animatingOutIds}
                  today={today}
                />
            </>
        )}
        {activeView === 'debts' && (
          <>
            <DebtSummary totalLent={totalLent} totalOwed={totalOwed} />
            <DebtFilterControls
              filter={debtFilter}
              onOpenModal={() => setIsDebtFilterModalOpen(true)}
              onResetFilter={handleResetDebtFilter}
            />
            <DebtList
              debts={filteredDebts}
              debtInstallments={debtInstallments || []}
              onEdit={handleOpenEditDebtForm}
              onSettle={handleOpenSettleConfirm}
              onForgive={handleOpenForgiveConfirm}
              onDelete={handleOpenDeleteModal}
              onAddInstallment={handleOpenAddInstallment}
              onEditInstallment={handleOpenEditInstallmentModal}
              onDeleteInstallment={handleOpenDeleteModal}
            />
          </>
        )}
        {activeView === 'investments' && (
          <>
            <InvestmentSummary totalInvested={totalInvested} currentPortfolioValue={currentPortfolioValue} />
            <InvestmentFilterControls
              filter={investmentFilter}
              onOpenModal={() => setIsInvestmentFilterModalOpen(true)}
              onResetFilter={handleResetInvestmentFilter}
            />
            <InvestmentList
              investments={filteredInvestments}
              investmentTransactions={investmentTransactions || []}
              onEdit={handleOpenEditInvestmentForm}
              onAddTransaction={handleOpenAddInvestmentTransactionModal}
              onUpdateValue={handleOpenUpdateValueModal}
              onSell={handleOpenSellInvestmentModal}
              onDelete={handleOpenDeleteModal}
              onEditTransaction={handleOpenEditInvestmentTransactionModal}
              onDeleteTransaction={handleOpenDeleteModal}
            />
          </>
        )}
        {activeView === "health" && (
          <FinancialHealth
            cash={globalBalance}
            investments={currentPortfolioValue}
            debt={totalOwed}
            moneyLent={totalLent}
            income={periodicOperationalIncome}
            expense={periodicOperationalExpense}
            cashFlowFilter={cashFlowFilter}
            onOpenModal={() => setIsCashFlowFilterModalOpen(true)}
            onResetFilter={handleResetCashFlowFilter}
            deficitThreshold={deficitThreshold}
          />
        )}
      </main>

      <AddTransactionButton
        onQuickAdd={handleQuickAdd}
        onSelectType={handleOpenAddForm}
        activeView={activeView}
      />
      
      {isFormModalOpen && (
        <TransactionFormModal
          isOpen={isFormModalOpen}
          onClose={closeAllModals}
          onSave={handleSaveTransaction}
          onSaveTransfer={handleSaveTransfer}
          transactionToEdit={editingTransaction}
          initialType={initialTransactionType}
          initialData={initialTransactionData}
          wallets={wallets}
          onAlert={showAlert}
        />
      )}

      {isDebtFormModalOpen && (
        <DebtFormModal
          isOpen={isDebtFormModalOpen}
          onClose={closeAllModals}
          onSave={handleSaveDebt}
          debtToEdit={editingDebt}
          initialType={initialDebtType}
          wallets={wallets}
        />
      )}

      {isDebtInstallmentModalOpen && (
        <DebtInstallmentModal
            isOpen={isDebtInstallmentModalOpen}
            onClose={closeAllModals}
            onSave={handleSaveDebtInstallment}
            debt={debtForInstallment}
            installmentToEdit={editingInstallment}
            wallets={wallets}
            installmentsForDebt={installmentsForDebt}
        />
      )}

      {isInvestmentFormModalOpen && (
        <InvestmentFormModal
          isOpen={isInvestmentFormModalOpen}
          onClose={closeAllModals}
          onSave={handleSaveInvestment}
          investmentToEdit={editingInvestment}
          wallets={wallets}
        />
      )}
      
      {isInvestmentTransactionFormModalOpen && (
        <InvestmentTransactionFormModal
            isOpen={isInvestmentTransactionFormModalOpen}
            onClose={closeAllModals}
            onSave={handleSaveInvestmentTransaction}
            investment={addingTransactionToInvestment}
            investmentTransactionToEdit={editingInvestmentTransaction}
            wallets={wallets}
        />
      )}

      {isUpdateValueModalOpen && (
        <UpdateInvestmentValueModal
          isOpen={isUpdateValueModalOpen}
          onClose={closeAllModals}
          onUpdate={handleUpdateInvestmentValue}
          investment={updatingInvestment}
        />
      )}
      
      {isSellInvestmentModalOpen && (
        <SellInvestmentModal
          isOpen={isSellInvestmentModalOpen}
          onClose={closeAllModals}
          onConfirm={handleSellInvestment}
          investment={sellingInvestment}
          wallets={wallets}
          onAlert={showAlert}
        />
      )}
      
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeAllModals}
          onConfirm={handleConfirmDelete}
          itemToDelete={itemToDelete}
        />
      )}
      
      {isSettleModalOpen && (
        <SettleDebtModal
          isOpen={isSettleModalOpen}
          onClose={closeAllModals}
          onConfirm={handleSettleDebt}
          debt={settlingDebt}
          installments={settlingDebtInstallments}
          wallets={wallets}
        />
      )}
      {isForgiveModalOpen &&(
        <ForgiveDebtModal
          isOpen={isForgiveModalOpen}
          onClose={() => setIsForgiveModalOpen(false)}
          onConfirm={handleForgiveDebt}
          debt={forgivingDebt}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)}
        currentDefault={defaultFilterPeriod}
        currentDefaultWallet={correctedDefaultWallet}
        currentDeficitThreshold={deficitThreshold}
        wallets={wallets}
        onSave={handleSaveSettings}
        onShowOnboarding={handleShowOnboarding}
        onOpenBulkAdd={() => { setIsSettingsModalOpen(false); setIsBulkAddModalOpen(true); }}
        onExportAllData={handleExportAllData}
        onImportData={handleImportData}
        onClearAllData={handleOpenClearDataModal}
        onAlert={showAlert}
      />
      
      {isReconcileModalOpen && (
        <ReconcileBalanceModal 
          isOpen={isReconcileModalOpen}
          onClose={() => setIsReconcileModalOpen(false)}
          onReconcile={handleReconcile}
          currentBalance={currentBalance}
        />
      )}

      {isBulkAddModalOpen && (
        <BulkAddModal
            isOpen={isBulkAddModalOpen}
            onClose={closeAllModals}
            onSave={handleBulkAddTransactions}
            wallets={wallets}
        />
      )}
      
      {isClearDataModalOpen && (
        <ClearDataConfirmationModal
            isOpen={isClearDataModalOpen}
            onClose={closeAllModals}
            onConfirm={handleClearAllData}
        />
      )}

      {isFilterModalOpen && (
        <FilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            onApply={handleApplyFilters}
            onExport={() => handleExport('transactions')}
            initialFilter={filter}
            wallets={wallets}
        />
      )}

      {isDebtFilterModalOpen && (
        <DebtFilterModal
            isOpen={isDebtFilterModalOpen}
            onClose={() => setIsDebtFilterModalOpen(false)}
            onApply={handleApplyDebtFilters}
            onExport={() => handleExport('debts')}
            initialFilter={debtFilter}
        />
      )}

      {isInvestmentFilterModalOpen && (
        <InvestmentFilterModal
            isOpen={isInvestmentFilterModalOpen}
            onClose={() => setIsInvestmentFilterModalOpen(false)}
            onApply={handleApplyInvestmentFilters}
            onExport={() => handleExport('investments')}
            initialFilter={investmentFilter}
            investmentTypes={uniqueInvestmentTypes}
        />
      )}

      {isCashFlowFilterModalOpen && (
        <CashFlowFilterModal
            isOpen={isCashFlowFilterModalOpen}
            onClose={() => setIsCashFlowFilterModalOpen(false)}
            onApply={handleApplyCashFlowFilters}
            initialFilter={cashFlowFilter}
        />
      )}
      
      {alertModal.isOpen && (
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ isOpen: false, title: '', message: '' })}
          title={alertModal.title}
          message={alertModal.message}
        />
      )}

      {importSummaryModal.isOpen && (
        <ImportSummaryModal
          isOpen={importSummaryModal.isOpen}
          onClose={() => setImportSummaryModal({ isOpen: false, summary: null })}
          summary={importSummaryModal.summary}
        />
      )}

    </div>
  );
};

export default App;
