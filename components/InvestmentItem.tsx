import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';
import { Investment, InvestmentStatus, InvestmentTransaction, InvestmentTransactionType } from '../types';
import { trackUserAction } from '../utils/tracking';

interface InvestmentItemProps {
  investment: Investment;
  transactions: InvestmentTransaction[];
  onEdit: (investment: Investment) => void;
  onAddTransaction: (investmentId: string) => void;
  onUpdateValue: (investment: Investment) => void;
  onSell: (investment: Investment) => void;
  onDelete: (investment: Investment) => void;
  onEditTransaction: (transaction: InvestmentTransaction) => void;
  onDeleteTransaction: (transaction: InvestmentTransaction) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
});

const TransactionRow: FC<{tx: InvestmentTransaction, onEdit: (tx: InvestmentTransaction) => void, onDelete: (tx: InvestmentTransaction) => void}> = ({ tx, onEdit, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isContribution = tx.type === InvestmentTransactionType.CONTRIBUTION;
    const isWithdrawal = tx.type === InvestmentTransactionType.WITHDRAWAL;
    
    const amountColor = isContribution ? 'text-blue-600 dark:text-blue-400' : 
                        isWithdrawal ? 'text-orange-600 dark:text-orange-400' :
                        'text-green-600 dark:text-green-400';
    const sign = isContribution ? '+' : isWithdrawal ? '-' : '+';

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`flex justify-between items-center py-2 px-3 rounded-md bg-slate-100 dark:bg-slate-700/50 ${menuOpen ? 'relative z-10' : ''}`}>
            <div>
                <p className="font-semibold text-sm capitalize text-slate-700 dark:text-slate-200">{tx.type}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(tx.date)}</p>
                {tx.notes && <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">{tx.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm ${amountColor}`}>{sign} {formatCurrency(tx.amount)}</p>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(prev => !prev)} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 origin-top-right">
                            <div className="py-1">
                                <button onClick={() => { onEdit(tx); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                                    Edit
                                </button>
                                <button onClick={() => { onDelete(tx); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

const InvestmentItem: FC<InvestmentItemProps> = ({ investment, transactions, onEdit, onAddTransaction, onUpdateValue, onSell, onDelete, onEditTransaction, onDeleteTransaction }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = investment.status === InvestmentStatus.ACTIVE;

  const { netInvested } = useMemo(() => {
    return transactions.reduce((acc, tx) => {
        if (tx.type === InvestmentTransactionType.CONTRIBUTION) {
            acc.netInvested += tx.amount;
        } else if (tx.type === InvestmentTransactionType.WITHDRAWAL) {
            acc.netInvested -= tx.amount;
        }
        return acc;
    }, { netInvested: 0 });
  }, [transactions]);

  const gainLoss = investment.currentValue - netInvested;
  const gainLossPercent = netInvested > 0 ? (gainLoss / netInvested) * 100 : 0;
  const gainLossColor = gainLoss >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
  const borderColor = isActive ? 'border-purple-300 dark:border-purple-500/50' : 'border-slate-300 dark:border-slate-600';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleExpand = async () => {
    const willBeExpanded = !isExpanded;
    try {
      await trackUserAction(willBeExpanded ? 'investment_item_expand' : 'investment_item_collapse', { investment_id: investment.id });
    } catch (error) {
      console.error('Error tracking expansion:', error);
    }
    setIsExpanded(willBeExpanded);
  };

  const handleMenuToggle = async () => {
    const willBeOpen = !menuOpen;
    if (willBeOpen) {
      try {
        await trackUserAction('open_investment_menu', { investment_id: investment.id });
      } catch (error) {
        console.error('Error tracking menu open:', error);
      }
    }
    setMenuOpen(willBeOpen);
  };

  return (
    <li className={`relative bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm transition-all duration-300 border-l-4 animate-fadeInUp ${borderColor} ${!isActive ? 'opacity-60' : ''} ${menuOpen ? 'z-20' : 'z-auto'}`}>
      <div className="flex justify-between items-start gap-4">
        <button onClick={handleToggleExpand} className="flex-grow text-left flex items-center gap-3 group">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <div>
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{investment.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{investment.type}</p>
                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Started: {formatDate(investment.startDate)}
                </p>
            </div>
        </button>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-xl">{formatCurrency(investment.currentValue)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Invested: {formatCurrency(netInvested)}
          </p>
          <p className={`text-sm font-semibold ${gainLossColor}`}>
            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainLossPercent.toFixed(1)}%)
          </p>
        </div>
        <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-haspopup="true" aria-expanded={menuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 origin-top-right">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  {isActive && (
                    <>
                      <button onClick={() => { onAddTransaction(investment.id); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        Add Transaction
                      </button>
                      <button onClick={() => { onUpdateValue(investment); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                        Update Value
                      </button>
                      <button onClick={() => { onSell(investment); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 004 0V7.151c.22.071.412.164.567.267C13.833 7.29 14 6.884 14 6.5 14 5.672 13.328 5 12.5 5h-5C6.672 5 6 5.672 6 6.5c0 .384.167.79.433.918z" /><path fillRule="evenodd" d="M7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                        Sell Investment
                      </button>
                    </>
                  )}
                  <button onClick={() => { onEdit(investment); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                    Edit
                  </button>
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  <button onClick={() => { onDelete(investment); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Transaction History</h4>
            {transactions.length > 0 ? (
                [...transactions]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(tx => <TransactionRow key={tx.id} tx={tx} onEdit={onEditTransaction} onDelete={onDeleteTransaction} />)
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No transactions recorded for this investment yet.</p>
            )}
        </div>
      )}

      {investment.notes && !isExpanded && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">
              <span className="font-semibold">Notes:</span> {investment.notes}
          </p>
      )}
    </li>
  );
};

export default InvestmentItem;