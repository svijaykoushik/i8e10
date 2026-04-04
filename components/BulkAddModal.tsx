

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { FC } from 'react';
import { Transaction, TransactionType } from '../types';
import Modal from './ui/Modal';


type ParsedLineValid = {
    id: string; // For React key
    isValid: true;
    data: Omit<Transaction, 'id' | 'isReconciliation' | 'transferId'>;
};

type ParsedLineInvalid = {
    id: string; // For React key
    isValid: false;
    originalLine: string;
    error: string;
};

type ParsedLine = ParsedLineValid | ParsedLineInvalid;


interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactions: Omit<Transaction, 'id' | 'isReconciliation' | 'transferId'>[]) => void;
  wallets: string[];
}

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = () => {
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
const parseLine = (
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
            date = foundDate;
            claimedIndices.add(i);
            break;
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

const MagicWandIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const BulkAddModal: FC<BulkAddModalProps> = ({ isOpen, onClose, onSave, wallets }) => {
    const [view, setView] = useState<'input' | 'review'>('input');
    const [rawText, setRawText] = useState('');
    const [lines, setLines] = useState<ParsedLine[]>([]);
    const [commonDate, setCommonDate] = useState(getLocalDateString());
    const [commonWallet, setCommonWallet] = useState('');
    
    // Refs for synced scrolling
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Live parsing state
    const liveParsedLinesInfo = useMemo(() => {
        return rawText.split('\n').map((line, index) => {
            const originalLine = line; 
            const trimmed = line.trim();
            if (!trimmed) {
                return { originalLine, isBlank: true, isValid: true };
            }
            try {
                const parsed = parseLine(originalLine, commonDate, commonWallet);
                return { originalLine, isBlank: false, isValid: parsed ? parsed.isValid : false, parsed };
            } catch (e) {
                console.error("Critical error parsing line:", line, e);
                return { originalLine, isBlank: false, isValid: false, error: "An error occurred during parsing." };
            }
        });
    }, [rawText, commonDate, commonWallet]);

    const liveValidCount = useMemo(() => liveParsedLinesInfo.filter(l => l.parsed?.isValid).length, [liveParsedLinesInfo]);

    const liveLineCount = useMemo(() => liveParsedLinesInfo.filter(l => !l.isBlank).length, [liveParsedLinesInfo]);

    // State for analytics
    const savedRef = useRef(false);
    const wasOpenRef = useRef(false);

    useEffect(() => {
        // Modal was just opened
        if (isOpen && !wasOpenRef.current) {
            setView('input');
            setRawText('');
            setLines([]);
            setCommonWallet(wallets.length > 0 ? wallets[0] : '');
            setCommonDate(getLocalDateString());
            savedRef.current = false;
        }
        
        // Update the ref at the end of the effect
        wasOpenRef.current = isOpen;
    }, [isOpen, wallets]);

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const handleReview = () => {
        const parsedLines = liveParsedLinesInfo
            .filter(info => !info.isBlank)
            .map(info => {
                 if (info.parsed) {
                     return info.parsed;
                 }
                 return {
                     id: crypto.randomUUID(),
                     isValid: false,
                     originalLine: info.originalLine,
                     error: info.error || "Invalid format."
                 } as ParsedLineInvalid;
            });

        setLines(parsedLines);
        setView('review');
    };

    const handleSave = () => {
        savedRef.current = true;
        const validTransactions = lines
            .filter((line): line is ParsedLineValid => line.isValid)
            .map(line => line.data);

        if(validTransactions.length > 0) {
            onSave(validTransactions);
        }
        onClose();
    };
    
    const handleUpdateLineData = (id: string, field: keyof ParsedLineValid['data'], value: any) => {
        setLines(currentLines => currentLines.map(line => {
            if (line.id === id && line.isValid) {
                const updatedData = { ...line.data, [field]: value };
                return { ...line, data: updatedData };
            }
            return line;
        }));
    };

    const validLinesCount = useMemo(() => lines.filter(l => l.isValid).length, [lines]);

    const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
    const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
    
    let footerContent = null;
    if (view === 'input') {
        footerContent = (
            <div className="flex justify-between items-center w-full">
                <button type="button" onClick={onClose} className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {liveValidCount > 0 ? `${liveValidCount} / ${liveLineCount} valid` : ''}
                    </p>
                    <button type="button" onClick={handleReview} disabled={!rawText.trim()} className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">Review</button>
                </div>
            </div>
        );
    } else {
        footerContent = (
            <div className="flex justify-between items-center w-full">
                <button type="button" onClick={() => setView('input')} className="btn-press text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-500">
                    &larr; Back to Edit
                </button>
                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{validLinesCount} valid</p>
                    <button type="button" onClick={handleSave} disabled={validLinesCount === 0} className="btn-press inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400">
                        Save All
                    </button>
                </div>
            </div>
        );
    }

    const modalTitle = (
        <div className="flex items-center gap-2">
            <MagicWandIcon className="w-6 h-6 text-indigo-500" />
            <span>Bulk Add Transactions</span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footerContent}>
            {view === 'input' && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Enter transactions one per line. You can include dates like <code className="bg-slate-200 dark:bg-slate-700 p-1 rounded">YYYY-MM-DD</code> or <code className="bg-slate-200 dark:bg-slate-700 p-1 rounded">today</code>.
                    </p>
                    <div className='p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 space-y-4'>
                        <h3 className='font-semibold text-slate-800 dark:text-slate-100'>Set defaults for new entries:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="common-date" className={labelClasses}>Default Date / இயல்பு தேதி</label>
                                <div className="mt-1"><input type="date" id="common-date" value={commonDate} onChange={(e) => setCommonDate(e.target.value)} className={inputBaseClasses} required /></div>
                            </div>
                             <div>
                                <label htmlFor="common-wallet" className={labelClasses}>Default Wallet / இயல்பு கணக்கு</label>
                                <div className="mt-1">
                                <select id="common-wallet" value={commonWallet} onChange={(e) => setCommonWallet(e.target.value)} className={inputBaseClasses} required>
                                        {wallets.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-full group">
                        <div
                            ref={backdropRef}
                            className={`${inputBaseClasses} font-mono absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-y-auto`}
                            aria-hidden="true"
                            style={{
                                color: 'transparent',
                                borderColor: 'transparent',
                                zIndex: 0
                            }}
                        >
                            {liveParsedLinesInfo.map((info, index) => {
                                const isError = !info.isBlank && !info.isValid;
                                return (
                                    <React.Fragment key={index}>
                                        <span className={isError ? "underline decoration-red-500 decoration-wavy underline-offset-4 decoration-2" : ""}>
                                            {info.originalLine || ' '}
                                        </span>
                                        {index < liveParsedLinesInfo.length - 1 ? '\n' : ''}
                                    </React.Fragment>
                                );
                            })}
                            {rawText.endsWith('\n') && <br />}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            onScroll={handleScroll}
                            rows={8}
                            className={`${inputBaseClasses} font-mono relative z-10 m-0`}
                            style={{
                                backgroundColor: 'transparent',
                                color: 'inherit',
                            }}
                            placeholder={"Coffee 150\nLunch with friends 800 yesterday\nSalary Received 50000 income 2023-10-01"}
                            autoFocus
                        />
                    </div>
                </div>
            )}
            {view === 'review' && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                       Review and edit the parsed transactions below. Any line that could not be understood is highlighted in red.
                    </p>
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                        {lines.map((line) => {
                            if (line.isValid) {
                                return (
                                    <div key={line.id} className="p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm space-y-2 border-l-4 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                        <div className="absolute top-1 right-1 opacity-20 pointer-events-none">
                                            <MagicWandIcon className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="grid grid-cols-12 gap-x-2 gap-y-2 items-center">
                                            <div className="col-span-12 sm:col-span-7">
                                                <label className="text-xs font-medium text-slate-500">Description</label>
                                                <input type="text" value={line.data.description} onChange={e => handleUpdateLineData(line.id, 'description', e.target.value)} className={`${inputBaseClasses} !py-1`} />
                                            </div>
                                            <div className="col-span-12 sm:col-span-5">
                                                <label className="text-xs font-medium text-slate-500">Amount</label>
                                                <input type="number" value={line.data.amount} onChange={e => handleUpdateLineData(line.id, 'amount', parseFloat(e.target.value) || 0)} className={`${inputBaseClasses} !py-1`} />
                                            </div>
                                            <div className="col-span-12 sm:col-span-5">
                                                <label className="text-xs font-medium text-slate-500">Date</label>
                                                <input type="date" value={line.data.date} onChange={e => handleUpdateLineData(line.id, 'date', e.target.value)} className={`${inputBaseClasses} !py-1`} />
                                            </div>
                                            <div className="col-span-7 sm:col-span-4">
                                                <label className="text-xs font-medium text-slate-500">Wallet</label>
                                                <select value={line.data.wallet} onChange={e => handleUpdateLineData(line.id, 'wallet', e.target.value)} className={`${inputBaseClasses} !py-1 !px-1.5 text-xs`}>
                                                    {wallets.map(w => <option key={w} value={w}>{w}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-5 sm:col-span-3">
                                                <label className="text-xs font-medium text-slate-500">Type</label>
                                                <select value={line.data.type} onChange={(e) => handleUpdateLineData(line.id, 'type', e.target.value as TransactionType)} className={`${inputBaseClasses} !py-1 !px-1.5 text-xs`}>
                                                    <option value={TransactionType.EXPENSE}>Expense</option>
                                                    <option value={TransactionType.INCOME}>Income</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                const invalidLine = line as ParsedLineInvalid;
                                return (
                                    <div key={invalidLine.id} className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border-l-4 border-red-200 dark:border-red-500/30 relative overflow-hidden">
                                        <div className="absolute top-1 right-1 opacity-20 pointer-events-none">
                                            <MagicWandIcon className="w-4 h-4 text-red-500 dark:text-red-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-mono text-red-700 dark:text-red-300">{invalidLine.originalLine}</p>
                                            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{invalidLine.error}</p>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default BulkAddModal;