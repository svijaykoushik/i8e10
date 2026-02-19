
import { Transaction, Debt, Investment, InvestmentTransaction, DebtInstallment, DebtStatus, Wallet } from '../types';

export const generateTransactionsCSV = (transactions: Transaction[], wallets?: Wallet[]): string => {
  if (transactions.length === 0) return '';

  const headers = ['ID', 'Type (வகை)', 'Date (தேதி)', 'Amount (தொகை)', 'Description (விளக்கம்)', 'Wallet (கணக்கு)', 'Wallet ID', 'Is Adjustment'];
  const csvRows = [headers.join(',')];

  transactions.forEach(tx => {
    const row = [
      tx.id,
      tx.type === 'income' ? 'Income (வரவு)' : 'Expense (செலவு)',
      tx.date,
      tx.amount,
      tx.description ? `"${tx.description.replace(/"/g, '""')}"` : "",
      wallets ? `"${(wallets.find(w => w.id === tx.walletId)?.name || (tx as any).wallet || '').replace(/"/g, '""')}"` : `"${((tx as any).wallet || '').replace(/"/g, '""')}"`,
      `"${(tx.walletId || '').replace(/"/g, '""')}"`,
      tx.isReconciliation ? 'Yes' : 'No'
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

export const generateWalletsCSV = (wallets: Wallet[]): string => {
    if (wallets.length === 0) return '';

    const headers = ['ID', 'Name', 'Type', 'Is Default', 'Is Archived'];
    const csvRows = [headers.join(',')];

    wallets.forEach(w => {
        const row = [
            w.id,
            `"${w.name.replace(/"/g, '""')}"`,
            w.type,
            w.isDefault ? 'Yes' : 'No',
            w.isArchived ? 'Yes' : 'No'
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};

export const generateDebtsCSV = (
  debts: Debt[]
): string => {
    if (debts.length === 0) return '';
  
    const headers = ['ID', 'Type (வகை)', 'Person (நபர்)', 'Date (தேதி)', 'Amount (தொகை)', 'Description (விளக்கம்)', 'Status (நிலை)'];
    const csvRows = [headers.join(',')];
  
    debts.forEach(debt => {
      let statusStr = 'Outstanding (நிலுவையில்)';
      if (debt.status === DebtStatus.SETTLED) statusStr = 'Settled (தீர்ந்தது)';
      else if (debt.status === DebtStatus.WAIVED) statusStr = 'Waived (தள்ளுபடி)';
      const row = [
        debt.id,
        debt.type === 'lent' ? 'Lent (கடன் கொடுத்தது)' : 'Owed (க கடன் வாங்கியது)',
        `"${debt.person.replace(/"/g, '""')}"`,
        debt.date,
        debt.amount,
        `"${debt.description.replace(/"/g, '""')}"`,
        statusStr
      ];
      csvRows.push(row.join(','));
    });
  
    return csvRows.join('\n');
};

export const generateDebtInstallmentsCSV = (installments: DebtInstallment[]): string => {
    if (installments.length === 0) return '';

    const headers = ["ID", "Debt ID", "Date", "Amount", "Notes"];
    const csvRows = [headers.join(",")];

    installments.filter((i)=>Number.isFinite(i.amount) && typeof i.note === 'string').forEach((installment) => {
      const row = [
        installment.id,
        installment.debtId,
        installment.date,
        installment.amount,
        `"${(installment.note || "").replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
};

export const generateInvestmentsCSV = (investments: Investment[]): string => {
    if (investments.length === 0) return '';

    const headers = ['ID', 'Name', 'Type', 'Start Date', 'Current Value', 'Status', 'Notes'];
    const csvRows = [headers.join(',')];

    investments.forEach(inv => {
        const row = [
            inv.id,
            `"${inv.name.replace(/"/g, '""')}"`,
            `"${inv.type.replace(/"/g, '""')}"`,
            inv.startDate,
            inv.currentValue,
            inv.status,
            `"${(inv.notes || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};


export const generateInvestmentTransactionsCSV = (transactions: InvestmentTransaction[]): string => {
    if (transactions.length === 0) return '';

    const headers = ['ID', 'Investment ID', 'Type', 'Date', 'Amount', 'Notes'];
    const csvRows = [headers.join(',')];

    transactions.forEach(tx => {
        const row = [
            tx.id,
            tx.investmentId,
            tx.type,
            tx.date,
            tx.amount,
            `"${(tx.notes || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};