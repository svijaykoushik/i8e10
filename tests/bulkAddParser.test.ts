import { expect, test, describe } from 'vitest';
import { parseLine } from '../utils/bulkAddParser';
import { TransactionType } from '../types';

describe('Bulk Add - parseLine', () => {
    const defaultDate = '2023-11-01';
    const defaultWallet = 'Cash';

    test('Basic Expense: parses simple description and amount', () => {
        const result = parseLine('Coffee 150', defaultDate, defaultWallet);
        expect(result).not.toBeNull();
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.description).toBe('Coffee');
            expect(result.data.amount).toBe(150);
            expect(result.data.type).toBe(TransactionType.EXPENSE);
            expect(result.data.date).toBe(defaultDate);
            expect(result.data.wallet).toBe(defaultWallet);
        }
    });

    test('Basic Income: parses keywords and sets type', () => {
        const result = parseLine('Salary 50000 income', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.description).toBe('Salary');
            expect(result.data.amount).toBe(50000);
            expect(result.data.type).toBe(TransactionType.INCOME);
        }
    });

    test('Date (ISO): extracts YYYY-MM-DD date', () => {
        const result = parseLine('Lunch 2023-10-25 450', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.date).toBe('2023-10-25');
            expect(result.data.amount).toBe(450);
            expect(result.data.description).toBe('Lunch');
        }
    });

    test('Date (Indian): extracts DD-MM-YYYY date', () => {
        const result = parseLine('Dinner 25-10-2023 800', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.date).toBe('2023-10-25');
            expect(result.data.amount).toBe(800);
            expect(result.data.description).toBe('Dinner');
        }
    });

    test('Date (Relative): parses "yesterday"', () => {
        const result = parseLine('Uber 250 yesterday', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yYear = yesterday.getFullYear();
            const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
            const yDay = String(yesterday.getDate()).padStart(2, '0');
            const expectedDate = `${yYear}-${yMonth}-${yDay}`;
            
            expect(result.data.date).toBe(expectedDate);
            expect(result.data.amount).toBe(250);
        }
    });

    test('Tamil Keywords: identifies "சம்பளம்" as income', () => {
        const result = parseLine('சம்பளம் 40000', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.description).toBe('சம்பளம்');
            expect(result.data.type).toBe(TransactionType.INCOME);
            expect(result.data.amount).toBe(40000);
        }
    });

    test('Tamil Keywords (Pure): identifies "வரவு" without adding to description', () => {
        const result = parseLine('வரவு 500', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.description).toBe('Income'); // defaults to Income when pure keyword is removed
            expect(result.data.type).toBe(TransactionType.INCOME);
            expect(result.data.amount).toBe(500);
        }
    });

    test('Complex Line: parses multi-word description, date, type keyword, and amount with comma', () => {
        const result = parseLine('2023-10-01 Received bonus 10,000 from boss', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.date).toBe('2023-10-01');
            expect(result.data.amount).toBe(10000);
            expect(result.data.type).toBe(TransactionType.INCOME);
            expect(result.data.description).toBe('Bonus from boss');
        }
    });

    test('Multiple Numbers: selects the last valid number as amount', () => {
        const result = parseLine('Buy 2 shirts for 1500', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.description).toBe('Buy 2 shirts for');
            expect(result.data.amount).toBe(1500);
        }
    });

    test('No Description: defaults to "Expense" or "Income"', () => {
        const result = parseLine('500 today', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.description).toBe('Expense');
            expect(result.data.amount).toBe(500);
        }
    });

    test('Malformed Date: falls back to default date', () => {
        const result = parseLine('Dinner 2023-99-99 500', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.date).toBe(defaultDate);
            expect(result.data.description).toBe('Dinner 2023-99-99');
            expect(result.data.amount).toBe(500);
        }
    });

    test('Negative Amount: uses absolute value', () => {
        const result = parseLine('Refund -500 income', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(true);
        if (result?.isValid) {
            expect(result.data.amount).toBe(500);
            expect(result.data.type).toBe(TransactionType.INCOME);
        }
    });

    test('Missing Amount: returns invalid', () => {
        const result = parseLine('Just some text', defaultDate, defaultWallet);
        expect(result?.isValid).toBe(false);
        if (result && result.isValid === false) {
            expect(result.error).toContain('amount');
        }
    });
});
