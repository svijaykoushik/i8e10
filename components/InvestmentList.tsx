

import React, { useMemo } from 'react';
import type { FC } from 'react';
import { Investment, InvestmentStatus, InvestmentTransaction } from '../types';
import InvestmentItem from './InvestmentItem';

interface InvestmentListProps {
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  onEdit: (investment: Investment) => void;
  onAddTransaction: (investmentId: string) => void;
  onUpdateValue: (investment: Investment) => void;
  onSell: (investment: Investment) => void;
  onDelete: (investment: Investment) => void;
  onEditTransaction: (transaction: InvestmentTransaction) => void;
  onDeleteTransaction: (transaction: InvestmentTransaction) => void;
}

const InvestmentList: FC<InvestmentListProps> = ({ 
    investments, 
    investmentTransactions, 
    onEdit, 
    onAddTransaction, 
    onUpdateValue, 
    onSell, 
    onDelete,
    onEditTransaction,
    onDeleteTransaction,
}) => {
  const transactionsByInvestmentId = useMemo(() => {
    const map = new Map<string, InvestmentTransaction[]>();
    investmentTransactions.forEach(tx => {
        const list = map.get(tx.investmentId) || [];
        list.push(tx);
        map.set(tx.investmentId, list);
    });
    return map;
  }, [investmentTransactions]);

  const { active, sold } = useMemo(() => {
    const activeInvestments: Investment[] = [];
    const soldInvestments: Investment[] = [];
    investments.forEach(inv => {
      if (inv.status === InvestmentStatus.ACTIVE) {
        activeInvestments.push(inv);
      } else {
        soldInvestments.push(inv);
      }
    });

    // Create a new sorted array to avoid mutating memoized state.
    const sortedSold = [...soldInvestments].sort((a, b) => {
        const txsA = transactionsByInvestmentId.get(a.id) || [];
        const txsB = transactionsByInvestmentId.get(b.id) || [];

        // Find the most recent transaction date for each sold investment to sort by when it was sold.
        const lastTxA = [...txsA].sort((tx1, tx2) => new Date(tx2.date).getTime() - new Date(tx1.date).getTime())[0];
        const lastTxB = [...txsB].sort((tx1, tx2) => new Date(tx2.date).getTime() - new Date(tx1.date).getTime())[0];
            
        const dateA = lastTxA ? new Date(lastTxA.date) : new Date(a.startDate);
        const dateB = lastTxB ? new Date(lastTxB.date) : new Date(b.startDate);

        return dateB.getTime() - dateA.getTime();
    });

    return { active: activeInvestments, sold: sortedSold };
  }, [investments, transactionsByInvestmentId]);
  
  if (investments.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">No Investments Found</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your assets like stocks, mutual funds, or real estate using the '+' button.
        </p>
         <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
         உங்கள் முதலீடுகளை இங்கே பதியலாம்.
        </p>
      </div>
    );
  }

  const ListSection: FC<{title: string; items: Investment[]}> = ({title, items}) => {
    if (items.length === 0) return null;
    return (
        <>
            <h3 className="px-1 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
            <ul className="space-y-3">
            {items.map(inv => {
                const transactionsForInvestment = transactionsByInvestmentId.get(inv.id) || [];
                return (
                    <InvestmentItem 
                        key={inv.id} 
                        investment={inv} 
                        transactions={transactionsForInvestment}
                        onEdit={onEdit} 
                        onAddTransaction={onAddTransaction}
                        onUpdateValue={onUpdateValue}
                        onSell={onSell}
                        onDelete={onDelete}
                        onEditTransaction={onEditTransaction}
                        onDeleteTransaction={onDeleteTransaction}
                    />
                );
            })}
            </ul>
        </>
    )
  }

  return (
    <div>
        <ListSection title="Active / செயல்பாட்டில்" items={active} />
        {active.length > 0 && sold.length > 0 && <hr className="my-6 border-slate-200 dark:border-slate-700" />}
        <ListSection title="Sold / விற்கப்பட்டவை" items={sold} />
    </div>
  );
};

export default InvestmentList;