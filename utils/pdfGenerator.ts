import { Transaction, TransactionType } from '../types';
import { numberToWords } from './numberToWords';

export function calculateIncomeStatementTotals(transactions: Transaction[]) {
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
        if (tx.type === TransactionType.INCOME) {
            totalIncome += tx.amount;
        } else if (tx.type === TransactionType.EXPENSE) {
            totalExpense += tx.amount;
        }
    }

    return {
        totalIncome,
        totalExpense,
        netFlow: totalIncome - totalExpense
    };
}

export async function generateIncomeStatementPDF(transactions: Transaction[], startDate: Date, endDate: Date) {
    // Dynamic import to avoid SSR issues if this app ever goes SSR, and to reduce initial bundle size
    const { default: jsPDF } = await import('jspdf');

    const { totalIncome, totalExpense, netFlow } = calculateIncomeStatementTotals(transactions);

    const doc = new jsPDF();
    
    // Page Border (1cm margin on all sides)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.rect(10, 10, 190, 277, 'D'); // Page border with 10mm margin

    // Attempt to load the logo
    try {
        const img = new Image();
        img.src = '/pwa-192x192.png';
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        doc.addImage(img, 'PNG', 160, 15, 30, 30);
    } catch (e) {
        console.warn("Could not load logo for PDF", e);
    }

    // Title
    doc.setFontSize(22);
    doc.setTextColor(33, 33, 33);
    doc.text('i8·e10 Income Statement', 14, 25);
    
    // Statement Date Label (Indian format)
    const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`, 14, 35);
    doc.text(`Statement Date: ${formatDate(new Date())}`, 14, 42);

    // Totals
    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(amount));
        const sign = amount < 0 ? '-' : '';
        return `Rs ${sign}${formatted}`;
    };

    let startY = 70;

    // TOTAL INCOME Box
    doc.setFillColor(220, 240, 220); // Light Green
    doc.rect(14, startY, 182, 12, 'F');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL INCOME:', 16, startY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(totalIncome), 194, startY + 8, { align: 'right' });
    
    // Amount in words
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`(${numberToWords(totalIncome)})`, 194, startY + 16, { align: 'right' });

    startY += 35; // Generous negative space

    // TOTAL EXPENSES Box
    doc.setFillColor(245, 230, 215); // Light Orange/Red
    doc.rect(14, startY, 182, 12, 'F');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL EXPENSES:', 16, startY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(totalExpense), 194, startY + 8, { align: 'right' });
    
    // Amount in words
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`(${numberToWords(totalExpense)})`, 194, startY + 16, { align: 'right' });

    startY += 40; // More negative space before Net Flow

    // NET FLOW Box
    doc.setFillColor(245, 240, 225); // Light Yellow/Tan
    doc.setDrawColor(0, 0, 0); // Black border
    doc.setLineWidth(0.5);
    doc.rect(14, startY, 182, 14, 'FD'); // Filled and outlined
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`NET ${netFlow >= 0 ? 'SURPLUS' : 'DEFICIT'}:`, 16, startY + 9);
    
    // Net Flow Value
    doc.setTextColor(netFlow >= 0 ? 0 : 200, netFlow >= 0 ? 120 : 0, 0); // Green if positive, Red if negative
    doc.text(formatCurrency(netFlow), 194, startY + 9, { align: 'right' });

    // Amount in words for Net Flow
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`(${numberToWords(netFlow)})`, 194, startY + 18, { align: 'right' });

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(14, startY + 25, 196, startY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Last Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, startY + 30);
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 14, 280);

    doc.save(`i8e10-Income-Statement-${new Date().toISOString().split('T')[0]}.pdf`);
}
