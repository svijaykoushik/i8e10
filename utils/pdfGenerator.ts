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
    const { default: autoTable } = await import('jspdf-autotable');

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

    // --- 1. Document Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("i8·e10", 14, 25); 

    doc.setFontSize(14);
    doc.text("INCOME STATEMENT", 14, 35);
    
    const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100); // Muted gray for the date
    doc.text(`For the period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 42);

    // Totals formatter
    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(amount));
        const sign = amount < 0 ? '-' : '';
        return `Rs ${sign}${formatted}`;
    };

    // --- 2. Data Table ---
    autoTable(doc, {
        startY: 55,
        theme: 'plain', // Removes default heavy gridlines for a clean look
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 6,
            textColor: [40, 40, 40],
        },
        columnStyles: {
            0: { halign: 'left' },  // Descriptions
            1: { halign: 'right' }  // Amounts
        },
        body: [
            [{ content: 'Total Income', styles: { fontStyle: 'bold', textColor: [0, 0, 0] } }, { content: formatCurrency(totalIncome), styles: { fontStyle: 'bold' } }],
            [{ content: `(${numberToWords(totalIncome)})`, styles: { fontStyle: 'italic', fontSize: 9, textColor: [100, 100, 100] } }, ''],
            
            ['', ''], // Spacer row

            [{ content: 'Total Expenses', styles: { fontStyle: 'bold', textColor: [0, 0, 0] } }, { content: formatCurrency(totalExpense), styles: { fontStyle: 'bold' } }],
            [{ content: `(${numberToWords(totalExpense)})`, styles: { fontStyle: 'italic', fontSize: 9, textColor: [100, 100, 100] } }, ''],

            ['', ''], // Spacer row

            [{ content: `NET ${netFlow >= 0 ? 'SURPLUS' : 'DEFICIT'}`, styles: { fontStyle: 'bold', fontSize: 12, textColor: [0, 0, 0] } }, 
             { content: formatCurrency(netFlow), styles: { fontStyle: 'bold', fontSize: 12, textColor: [0, 0, 0] } }],
            [{ content: `(A net ${netFlow >= 0 ? 'surplus' : 'deficit'} of ${numberToWords(netFlow)})`, styles: { fontStyle: 'italic', fontSize: 9, textColor: [100, 100, 100] } }, ''],
        ],
        
        // --- 3. Custom Drawing for Accounting Lines ---
        didDrawCell: (data) => {
            const rowFirstCell = data.row.raw[0];
            const content = typeof rowFirstCell === 'object' && rowFirstCell !== null ? (rowFirstCell as any).content : rowFirstCell;
            
            // Draw a line above Totals
            if (content === 'Total Income' || content === 'Total Expenses') {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            }
            
            // Draw a double line under Net Income
            if (typeof content === 'string' && content.startsWith('NET ')) {
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                // Top line
                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                // Bottom double line
                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                doc.line(data.cell.x, data.cell.y + data.cell.height + 1, data.cell.x + data.cell.width, data.cell.y + data.cell.height + 1);
            }
        }
    });

    // Footer
    // We get the final Y position from autotable
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, finalY + 25, 196, finalY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Statement Date: ${formatDate(new Date())}`, 14, finalY + 30);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${formatDate(new Date())} at ${new Date().toLocaleTimeString('en-IN')}`, 14, 278);
    
    // Fine print
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text("DISCLAIMER: This statement is based on the entries made in the application. Always verify with actual records for accuracy.", 14, 283);

    doc.save(`i8e10-Income-Statement-${new Date().toISOString().split('T')[0]}.pdf`);
}
