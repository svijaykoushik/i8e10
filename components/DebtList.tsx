



import React, { useMemo } from 'react';
import type { FC } from 'react';
import { Debt, DebtInstallment, DebtStatus } from '../types';
import DebtItem from './DebtItem';

interface DebtListProps {
  debts: Debt[];
  debtInstallments: DebtInstallment[];
  onEdit: (debt: Debt) => void;
  onSettle: (debt: Debt) => void;
  onForgive: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onAddInstallment: (debt: Debt) => void;
  onEditInstallment: (inst: DebtInstallment) => void; 
  onDeleteInstallment: (inst: DebtInstallment) => void;
}

const DebtList: FC<DebtListProps> = ({ debts, onEdit, onSettle, onForgive, onDelete, onAddInstallment, onEditInstallment, onDeleteInstallment, debtInstallments }: DebtListProps) => {
  const { outstanding, settled } = useMemo(() => {
    const outstanding: Debt[] = [];
    const settled: Debt[] = [];
    debts.forEach(d => {
      if (d.status === DebtStatus.OUTSTANDING) {
        outstanding.push(d);
      } else {
        // Includes SETTLED and WAIVED
        settled.push(d);
      }
    });
    // Sort settled debts by date descending
    settled.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { outstanding, settled };
  }, [debts]);

  const installmentsByDebtId:Map<string, DebtInstallment[]> = useMemo(() => {
      const map = new Map<string, DebtInstallment[]>();
      debtInstallments.forEach(di => {
          const list = map.get(di.debtId) || [];
          list.push(di);
          map.set(di.debtId, list);
      });
      return map;
    }, [debtInstallments]);
  
  if (debts.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 9m18 3V9" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">No Debts or Loans</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track money you've lent or owe using the '+' button below.
        </p>
         <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          நீங்கள் கொடுத்த அல்லது வாங்கிய கடன்களை இங்கே பதியலாம்.
        </p>
      </div>
    );
  }

  const ListSection: FC<{title: string; items: Debt[]}> = ({title, items}:{title: string; items: Debt[]}) => {
    if (items.length === 0) return null;
    return (
        <>
            <h3 className="px-1 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
            <ul className="space-y-2">
            {items.map(d => {
              const installments = installmentsByDebtId.get(d.id)
              return(
                <DebtItem key={d.id} debt={d} onEdit={onEdit} onSettle={onSettle} onForgive={onForgive} onDelete={onDelete} onAddInstallment={onAddInstallment} onDeleteInstallment={onDeleteInstallment} onEditInstallment={onEditInstallment} installments={installments}/>
              )})}
            </ul>
        </>
    )
  }

  return (
    <div>
        <ListSection title="Outstanding / நிலுவையில்" items={outstanding} />
        {outstanding.length > 0 && settled.length > 0 && <hr className="my-6 border-slate-200 dark:border-slate-700" />}
        <ListSection title="History (Settled/Forgiven) / வரலாறு" items={settled} />
    </div>
  );
};

export default DebtList;