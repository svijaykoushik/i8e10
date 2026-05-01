import { describe, it, expect, vi } from 'vitest';
import { calculateIncomeStatementTotals } from '../utils/pdfGenerator';
import { Transaction, TransactionType } from '../types';

describe('pdfGenerator', () => {
    describe('calculateIncomeStatementTotals', () => {
        it('should correctly sum income, expenses, and calculate net flow', () => {
            const transactions: Transaction[] = [
                {
                    id: '1',
                    type: TransactionType.INCOME,
                    amount: 5000,
                    date: '2023-10-01',
                    description: 'Salary',
                    wallet: 'w1'
                },
                {
                    id: '2',
                    type: TransactionType.EXPENSE,
                    amount: 1500,
                    date: '2023-10-05',
                    description: 'Rent',
                    wallet: 'w1'
                },
                {
                    id: '3',
                    type: TransactionType.EXPENSE,
                    amount: 500,
                    date: '2023-10-10',
                    description: 'Groceries',
                    wallet: 'w1'
                },
                {
                    id: '4',
                    type: TransactionType.INCOME,
                    amount: 200,
                    date: '2023-10-15',
                    description: 'Bonus',
                    wallet: 'w1'
                }
            ];

            const result = calculateIncomeStatementTotals(transactions);

            expect(result.totalIncome).toBe(5200);
            expect(result.totalExpense).toBe(2000);
            expect(result.netFlow).toBe(3200);
        });

        it('should return zeros for empty transaction list', () => {
            const result = calculateIncomeStatementTotals([]);
            expect(result.totalIncome).toBe(0);
            expect(result.totalExpense).toBe(0);
            expect(result.netFlow).toBe(0);
        });
    });
});
