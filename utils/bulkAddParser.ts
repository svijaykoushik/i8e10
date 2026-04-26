import { Transaction, TransactionType } from '../types';

export type ParsedLineValid = {
    id: string; // For React key
    isValid: true;
    data: Omit<Transaction, 'id' | 'isReconciliation' | 'transferId'>;
};

export type ParsedLineInvalid = {
    id: string; // For React key
    isValid: false;
    originalLine: string;
    error: string;
};

export type ParsedLine = ParsedLineValid | ParsedLineInvalid;

export const getLocalDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = () => {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parses a single line of text into a transaction object. This version uses a more
 * robust, multi-pass approach to correctly identify parts of the transaction.
 */
export const parseLine = (
    line: string,
    defaultDate: string,
    defaultWallet: string
): ParsedLine | null => {
    const originalLine = line.trim();
    if (!originalLine) return null;

    const id = crypto.randomUUID();
    const tokens = originalLine.split(/\s+/);

    if (tokens.length < 2) {
        return { id, isValid: false, originalLine, error: 'Line must have at least a description and an amount.' };
    }

    let amount: number | null = null;
    let date: string | null = null;
    let type = TransactionType.EXPENSE;
    const claimedIndices = new Set<number>();

    // Pass 1: Find and claim Date.
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].toLowerCase();
        let foundDate: string | null = null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
            foundDate = token;
        } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(token)) {
            const parts = token.split(/[-\/]/);
            foundDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (token === 'today') {
            foundDate = getLocalDateString();
        } else if (token === 'yesterday') {
            foundDate = getYesterdayDateString();
        }

        if (foundDate) {
            // Validate that the date is a real date
            if (!isNaN(Date.parse(foundDate))) {
                date = foundDate;
                claimedIndices.add(i);
                break;
            }
        }
    }

    // Pass 2: Find and claim Amount (last number is most reliable).
    for (let i = tokens.length - 1; i >= 0; i--) {
        if (claimedIndices.has(i)) continue;
        const numericValue = parseFloat(tokens[i].replace(/,/g, ''));
        if (!isNaN(numericValue) && isFinite(numericValue)) {
            amount = numericValue;
            claimedIndices.add(i);
            break;
        }
    }

    if (amount === null) {
        return { id, isValid: false, originalLine, error: 'Could not find a valid amount.' };
    }
    
    // Pass 3: Find and claim pure type keywords. These are NOT part of the description.
    const pureTypeKeywords = ['income', 'received', 'credited', 'வரவு'];
    for (let i = 0; i < tokens.length; i++) {
        if (claimedIndices.has(i)) continue;
        const lowerToken = tokens[i].toLowerCase();
        if (pureTypeKeywords.includes(lowerToken)) {
            type = TransactionType.INCOME;
            claimedIndices.add(i);
        }
    }

    // Pass 4: Check for descriptive type keywords. These ARE part of the description.
    const descriptiveTypeKeywords = ['salary', 'bonus', 'சம்பளம்'];
     for (let i = 0; i < tokens.length; i++) {
        if (claimedIndices.has(i)) continue;
        const lowerToken = tokens[i].toLowerCase();
        if (descriptiveTypeKeywords.includes(lowerToken)) {
            type = TransactionType.INCOME;
        }
    }
    
    // Pass 5: Build description from all remaining unclaimed tokens.
    const descriptionTokens = tokens.filter((_, index) => !claimedIndices.has(index));
    let description = descriptionTokens.join(' ').trim();

    if (!description) {
        description = type === TransactionType.INCOME ? 'Income' : 'Expense';
    } else {
        description = description.charAt(0).toUpperCase() + description.slice(1);
    }

    return {
        id,
        isValid: true,
        data: {
            type,
            amount: Math.abs(amount),
            description,
            date: date || defaultDate,
            wallet: defaultWallet,
        }
    };
};
