import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { AppSetting, db } from '../utils/db';
import { liveQuery } from '../src/db/liveQuery';
import {
  Transaction,
  Debt,
  DebtInstallment,
  Investment,
  InvestmentTransaction,
  Wallet,
} from '../types';

interface DatabaseContextType {
  // Live data
  transactions: Transaction[];
  debts: Debt[];
  debtInstallments: DebtInstallment[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  wallets: Wallet[];
  settings: AppSetting[];
  isDataLoading: boolean;
  // Database actions
  actions: {
    // ── Settings ──────────────────────────────────────────────────────────
    getSetting: (key: string) => Promise<AppSetting | undefined>;
    putSetting: (setting: AppSetting) => Promise<void>;
    bulkPutSettings: (settings: AppSetting[]) => Promise<void>;

    // ── Transactions ──────────────────────────────────────────────────────
    getTransaction: (id: string) => Promise<Transaction | undefined>;
    addTransaction: (tx: Transaction) => Promise<void>;
    updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    bulkAddTransactions: (items: Transaction[]) => Promise<void>;
    bulkPutTransactions: (items: Transaction[]) => Promise<void>;

    // ── Debts ─────────────────────────────────────────────────────────────
    addDebt: (debt: Debt) => Promise<void>;
    updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
    deleteDebt: (id: string) => Promise<void>;
    bulkPutDebts: (items: Debt[]) => Promise<void>;

    // ── Debt Installments ─────────────────────────────────────────────────
    addDebtInstallment: (item: DebtInstallment) => Promise<void>;
    updateDebtInstallment: (id: string, changes: Partial<DebtInstallment>) => Promise<void>;
    deleteDebtInstallment: (id: string) => Promise<void>;
    bulkPutDebtInstallments: (items: DebtInstallment[]) => Promise<void>;

    // ── Investments ───────────────────────────────────────────────────────
    addInvestment: (investment: Investment) => Promise<void>;
    updateInvestment: (id: string, investment: Partial<Investment>) => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;
    bulkPutInvestments: (items: Investment[]) => Promise<void>;

    // ── Investment Transactions ───────────────────────────────────────────
    addInvestmentTransaction: (item: InvestmentTransaction) => Promise<void>;
    deleteInvestmentTransaction: (id: string) => Promise<void>;
    bulkPutInvestmentTransactions: (items: InvestmentTransaction[]) => Promise<void>;

    // ── Wallets ───────────────────────────────────────────────────────────
    addWallet: (wallet: Wallet) => Promise<void>;
    updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
    deleteWallet: (id: string) => Promise<void>;
    bulkAddWallets: (items: Wallet[]) => Promise<void>;
    bulkPutWallets: (items: Wallet[]) => Promise<void>;
    bulkDeleteWallets: (ids: string[]) => Promise<void>;
    countWallets: () => Promise<number>;

    // ── DB transactions & lifecycle ───────────────────────────────────────
    transaction: <T extends unknown>(mode: 'rw' | 'r', tables: any[], callback: () => Promise<T>) => Promise<T>;
    clearDatabase: () => Promise<void>;
    openDatabase: () => Promise<void>;
  };
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<{
    transactions: Transaction[];
    debts: Debt[];
    debtInstallments: DebtInstallment[];
    investments: Investment[];
    investmentTransactions: InvestmentTransaction[];
    wallets: Wallet[];
    settings: AppSetting[];
  }>({
    transactions: [],
    debts: [],
    debtInstallments: [],
    investments: [],
    investmentTransactions: [],
    wallets: [],
    settings: [],
  });
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [txns, debts, debtInstallments, investments, investmentTransactions, wallets, appSettings] =
        await Promise.allSettled([
          db.transactionItems.orderBy('date').reverse().toArray() as Promise<Transaction[]>,
          db.debts.orderBy('date').reverse().toArray() as Promise<Debt[]>,
          db.debtInstallements.orderBy('date').reverse().toArray() as Promise<DebtInstallment[]>,
          db.investments.orderBy('startDate').reverse().toArray() as Promise<Investment[]>,
          db.investmentTransactions.toArray() as Promise<InvestmentTransaction[]>,
          db.wallets.toArray() as Promise<Wallet[]>,
          db.settings.toArray() as Promise<AppSetting[]>,
        ]);

      return {
        txns: txns.status === 'fulfilled' ? txns.value : [],
        debts: debts.status === 'fulfilled' ? debts.value : [],
        debtInstallments: debtInstallments.status === 'fulfilled' ? debtInstallments.value : [],
        investments: investments.status === 'fulfilled' ? investments.value : [],
        investmentTransactions: investmentTransactions.status === 'fulfilled' ? investmentTransactions.value : [],
        wallets: wallets.status === 'fulfilled' ? wallets.value : [],
        appSettings: appSettings.status === 'fulfilled' ? appSettings.value : [],
      };
    };

    setIsDataLoading(true);
    const sub = liveQuery(() => loadData()).subscribe((val) => {
      setData({
        transactions: val.txns,
        debts: val.debts,
        debtInstallments: val.debtInstallments,
        investments: val.investments,
        investmentTransactions: val.investmentTransactions,
        wallets: val.wallets,
        settings: val.appSettings,
      });
      setIsDataLoading(false);
    });

    return () => sub.unsubscribe();
  }, []);

  const actions: DatabaseContextType['actions'] = {
    // ── Settings ────────────────────────────────────────────────────────────
    getSetting: async (key) => db.settings.get(key),
    putSetting: async (setting) => { await db.settings.put(setting); },
    bulkPutSettings: async (settings) => { await db.settings.bulkPut(settings); },

    // ── Transactions ──────────────────────────────────────────────────────
    getTransaction: async (id) => db.transactionItems.get(id),
    addTransaction: async (tx) => { await db.transactionItems.add(tx); },
    updateTransaction: async (id, changes) => { await db.transactionItems.update(id, changes as Transaction); },
    deleteTransaction: async (id) => { await db.transactionItems.delete(id); },
    bulkAddTransactions: async (items) => { await db.transactionItems.bulkAdd(items); },
    bulkPutTransactions: async (items) => { await db.transactionItems.bulkPut(items); },

    // ── Debts ──────────────────────────────────────────────────────────────
    addDebt: async (debt) => { await db.debts.add(debt); },
    updateDebt: async (id, changes) => { await db.debts.update(id, changes as Debt); },
    deleteDebt: async (id) => { await db.debts.delete(id); },
    bulkPutDebts: async (items) => { await db.debts.bulkPut(items); },

    // ── Debt Installments ──────────────────────────────────────────────────
    addDebtInstallment: async (item) => { await db.debtInstallements.add(item); },
    updateDebtInstallment: async (id, changes) => { await db.debtInstallements.update(id, changes as DebtInstallment); },
    deleteDebtInstallment: async (id) => { await db.debtInstallements.delete(id); },
    bulkPutDebtInstallments: async (items) => { await db.debtInstallements.bulkPut(items); },

    // ── Investments ────────────────────────────────────────────────────────
    addInvestment: async (investment) => { await db.investments.add(investment); },
    updateInvestment: async (id, changes) => { await db.investments.update(id, changes as Investment); },
    deleteInvestment: async (id) => { await db.investments.delete(id); },
    bulkPutInvestments: async (items) => { await db.investments.bulkPut(items); },

    // ── Investment Transactions ────────────────────────────────────────────
    addInvestmentTransaction: async (item) => { await db.investmentTransactions.add(item); },
    deleteInvestmentTransaction: async (id) => { await db.investmentTransactions.delete(id); },
    bulkPutInvestmentTransactions: async (items) => { await db.investmentTransactions.bulkPut(items); },

    // ── Wallets ────────────────────────────────────────────────────────────
    addWallet: async (wallet) => { await db.wallets.add(wallet); },
    updateWallet: async (id, changes) => { await db.wallets.update(id, changes as Wallet); },
    deleteWallet: async (id) => { await db.wallets.delete(id); },
    bulkAddWallets: async (items) => { await db.wallets.bulkAdd(items); },
    bulkPutWallets: async (items) => { await db.wallets.bulkPut(items); },
    bulkDeleteWallets: async (ids) => { await db.wallets.bulkDelete(ids); },
    countWallets: async () => db.wallets.count(),

    // ── DB transactions & lifecycle ────────────────────────────────────────
    transaction: async <T extends unknown>(mode: 'rw' | 'r', tables: any[], callback: () => Promise<T>) => {
      return db.transaction(mode as any, tables, callback);
    },
    clearDatabase: async () => {
      await db.delete();
      await db.open();
    },
    openDatabase: async () => {
      await db.open();
    },
  };

  return (
    <DatabaseContext.Provider value={{ ...data, isDataLoading, actions }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};