
import { Transaction, TransactionType, Debt, DebtType, DebtStatus, Investment, InvestmentStatus, InvestmentTransaction, InvestmentTransactionType, DebtInstallment } from '../types';

export interface ParseError {
    originalRow: string[];
    message: string;
}

export interface ParseResult<T> {
    successful: T[];
    errors: ParseError[];
}

/**
 * A simple but robust CSV parser that handles quoted fields.
 * @param csvString The raw CSV content.
 * @returns An array of string arrays, where each inner array represents a row.
 */
const parseCSV = (csvString: string): string[][] => {
    if (!csvString) return [];
    const rows = csvString.trim().split(/\r?\n/);
    if (rows.length === 0) return [];

    // This parser is simple and assumes quotes are only used to wrap fields, not within them.
    return rows.map(row => {
        const result: string[] = [];
        let currentField = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField);
        // Trim whitespace and remove surrounding quotes from each parsed field
        return result.map(field => field.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    });
};


export const parseTransactionsCSV = (csvString: string): ParseResult<Transaction> => {
    const data = parseCSV(csvString);
    if (data.length < 2) return { successful: [], errors: [] };

    const result: ParseResult<Transaction> = { successful: [], errors: [] };

    data.slice(1).forEach(row => {
        try {
            let id: string;
            let typeStr: string, date: string, amountStr: string, description: string, wallet: string, isReconStr: string;
            
            // Handle both old (6 columns) and new (7 columns with ID) formats
            if (row.length === 7) {
                [id, typeStr, date, amountStr, description, wallet, isReconStr] = row;
            } else if (row.length === 6) {
                [typeStr, date, amountStr, description, wallet, isReconStr] = row;
                id = crypto.randomUUID(); // Generate new ID for old format
            } else {
                throw new Error(`Incorrect number of columns. Expected 6 or 7, but got ${row.length}.`);
            }
            
            const transaction: Transaction = {
                id,
                type: typeStr.includes('Income') ? TransactionType.INCOME : TransactionType.EXPENSE,
                date: date,
                amount: parseFloat(amountStr),
                description: description || '',
                wallet: wallet || undefined,
                isReconciliation: isReconStr === 'Yes',
            };
            if (!id) throw new Error("Missing ID in row.");
            if (isNaN(transaction.amount)) throw new Error(`Invalid amount: "${amountStr}"`);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) throw new Error(`Invalid date format: "${date}"`);
            
            result.successful.push(transaction);
        } catch (e: any) {
            result.errors.push({ originalRow: row, message: e.message || 'Malformed row' });
        }
    });
    return result;
};


export const parseDebtsCSV = (csvString: string): ParseResult<Debt> => {
    const data = parseCSV(csvString);
    if (data.length < 2) return { successful: [], errors: [] };
    
    const result: ParseResult<Debt> = { successful: [], errors: [] };
    
    data.slice(1).forEach(row => {
         try {
            let id: string;
            let typeStr: string, person: string, date: string, amountStr: string, description: string, statusStr: string;

            if (row.length === 7) {
                [id, typeStr, person, date, amountStr, description, statusStr] = row;
            } else if (row.length === 6) {
                [typeStr, person, date, amountStr, description, statusStr] = row;
                id = crypto.randomUUID();
            } else {
                throw new Error(`Incorrect number of columns. Expected 6 or 7, but got ${row.length}.`);
            }

            let status = DebtStatus.OUTSTANDING;
            if (statusStr.includes('Settled')) status = DebtStatus.SETTLED;
            else if (statusStr.includes('Waived') || statusStr.includes('தள்ளுபடி')) status = DebtStatus.WAIVED;

            const debt: Debt = {
                id,
                type: typeStr.includes('Lent') ? DebtType.LENT : DebtType.OWED,
                person,
                date,
                amount: parseFloat(amountStr),
                description,
                status,
            };

            if (!id) throw new Error("Missing ID in row.");
            if (isNaN(debt.amount)) throw new Error(`Invalid amount: "${amountStr}"`);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(debt.date)) throw new Error(`Invalid date format: "${date}"`);

            result.successful.push(debt);
        } catch(e: any) {
            result.errors.push({ originalRow: row, message: e.message || 'Malformed row' });
        }
    });
    return result;
};


export const parseDebtInstallmentsCSV = (csvString: string): ParseResult<DebtInstallment> => {
    const data = parseCSV(csvString);
    if (data.length < 2) return { successful: [], errors: [] };
    
    const result: ParseResult<DebtInstallment> = { successful: [], errors: [] };
    
    data.slice(1).forEach(row => {
         try {
            let id: string;
            let debtId: string, date: string, amountStr: string, note: string;

            if (row.length === 5) {
                [id, debtId, date, amountStr, note] = row;
            } else {
                throw new Error(`Incorrect number of columns. Expected 6 or 7, but got ${row.length}.`);
            }

            const debt: DebtInstallment = {
                id,
                debtId,
                date,
                amount: parseFloat(amountStr),
                note,
            };

            if (!id) throw new Error("Missing ID in row.");
            if (isNaN(debt.amount)) throw new Error(`Invalid amount: "${amountStr}"`);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(debt.date)) throw new Error(`Invalid date format: "${date}"`);

            result.successful.push(debt);
        } catch(e: any) {
            result.errors.push({ originalRow: row, message: e.message || 'Malformed row' });
        }
    });
    return result;
};

export const parseInvestmentsCSV = (csvString: string): ParseResult<Investment> => {
    const data = parseCSV(csvString);
    if (data.length < 2) return { successful: [], errors: [] };

    const result: ParseResult<Investment> = { successful: [], errors: [] };
    
    data.slice(1).forEach(row => {
        try {
            let id: string;
            let name: string, type: string, startDate: string, valueStr: string, statusStr: string, notes: string | undefined;
            
            if (row.length >= 7) { // >= to handle optional notes
                [id, name, type, startDate, valueStr, statusStr, notes] = row;
            } else if (row.length >= 6) {
                [name, type, startDate, valueStr, statusStr, notes] = row;
                id = crypto.randomUUID();
            } else {
                throw new Error(`Incorrect number of columns. Expected 6 or 7, but got ${row.length}.`);
            }
            
            const investment: Investment = {
                id,
                name,
                type,
                startDate,
                currentValue: parseFloat(valueStr),
                status: statusStr as InvestmentStatus,
                notes: notes || undefined,
            };

            if (!id) throw new Error("Missing ID in row.");
            if (isNaN(investment.currentValue)) throw new Error(`Invalid current value: "${valueStr}"`);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(investment.startDate)) throw new Error(`Invalid date format: "${startDate}"`);
            if (!Object.values(InvestmentStatus).includes(investment.status)) throw new Error(`Invalid status: "${statusStr}"`);

            result.successful.push(investment);
        } catch(e: any) {
            result.errors.push({ originalRow: row, message: e.message || 'Malformed row' });
        }
    });
    return result;
};


export const parseInvestmentTransactionsCSV = (csvString: string): ParseResult<InvestmentTransaction> => {
    const data = parseCSV(csvString);
    if (data.length < 2) return { successful: [], errors: [] };

    const result: ParseResult<InvestmentTransaction> = { successful: [], errors: [] };
    
    data.slice(1).forEach(row => {
        try {
            let id: string;
            let investmentId: string, typeStr: string, date: string, amountStr: string, notes: string | undefined;

            if (row.length >= 6) { // >= to handle optional notes
                [id, investmentId, typeStr, date, amountStr, notes] = row;
            } else if (row.length >= 5) {
                [investmentId, typeStr, date, amountStr, notes] = row;
                id = crypto.randomUUID();
            } else {
                throw new Error(`Incorrect number of columns. Expected 5 or 6, but got ${row.length}.`);
            }
            
            const tx: InvestmentTransaction = {
                id,
                investmentId,
                type: typeStr as InvestmentTransactionType,
                date,
                amount: parseFloat(amountStr),
                notes: notes || undefined,
            };

            if (!id) throw new Error("Missing ID in row.");
            if (isNaN(tx.amount)) throw new Error(`Invalid amount: "${amountStr}"`);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) throw new Error(`Invalid date format: "${date}"`);
            if (!Object.values(InvestmentTransactionType).includes(tx.type)) throw new Error(`Invalid transaction type: "${typeStr}"`);

            result.successful.push(tx);
        } catch(e: any) {
            result.errors.push({ originalRow: row, message: e.message || 'Malformed row' });
        }
    });
    return result;
};