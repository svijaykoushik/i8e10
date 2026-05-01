import { Page, expect } from '@playwright/test';

export async function getTotalBalance(page: Page) {
  const text = await page.locator('.text-5xl.font-bold').textContent();
  return parseFloat(text?.replace(/[^\d.-]/g, '') || '0');
}

export async function getWalletBalance(page: Page, walletName: string) {
    // Open filters
    await page.getByLabel('Open filters').click();
    await page.waitForSelector('#filter-modal', { state: 'visible' });
    
    // Select wallet
    await page.selectOption('#filter-wallet', { label: walletName });
    
    // Apply filters
    await page.getByRole('button', { name: /Apply Filters/i }).click();
    await page.waitForSelector('#filter-modal', { state: 'hidden' });
    
    // Give it a moment for the AnimatedNumber to finish
    await page.waitForTimeout(1000);
    
    const balance = await getTotalBalance(page);
    
    // Reset wallet filter for next operations
    await page.getByLabel('Open filters').click();
    await page.waitForSelector('#filter-modal', { state: 'visible' });
    await page.selectOption('#filter-wallet', 'all');
    await page.getByRole('button', { name: /Apply Filters/i }).click();
    await page.waitForSelector('#filter-modal', { state: 'hidden' });
    await page.waitForTimeout(1000);
    
    return balance;
}

export async function createTransaction(page: Page, params: {
    type: 'income' | 'expense' | 'transfer' | 'reconcile',
    amount: string,
    description?: string,
    wallet?: string,
    fromWallet?: string,
    toWallet?: string
}) {
    if (params.type === 'reconcile') {
        // Reconciliation is done through the Reconcile button on a specific wallet
        if (params.wallet) {
            // First select the wallet
            await page.getByLabel('Open filters').click();
            await page.selectOption('#filter-wallet', { label: params.wallet });
            await page.getByRole('button', { name: /Apply Filters/i }).click();
            await page.waitForSelector('#filter-modal', { state: 'hidden' });
            await page.waitForTimeout(1000);
        }

        await page.getByLabel('Reconcile balance').click();
        await page.waitForSelector('#reconcile-form', { state: 'visible' });
        await page.fill('#actualBalance', params.amount);
        await page.getByRole('button', { name: /Confirm and Adjust/i }).click();
        await page.waitForSelector('#reconcile-form', { state: 'hidden' });
        
        // Reset filter if we changed it
        if (params.wallet) {
            await page.getByLabel('Open filters').click();
            await page.selectOption('#filter-wallet', 'all');
            await page.getByRole('button', { name: /Apply Filters/i }).click();
            await page.waitForSelector('#filter-modal', { state: 'hidden' });
            await page.waitForTimeout(1000);
        }
        return;
    }

    await page.getByLabel(/Add Expense/i).click();
    await page.waitForSelector('#transaction-form', { state: 'visible' });

    if (params.type === 'income') {
        await page.getByRole('button', { name: 'Income', exact: true }).click();
    } else if (params.type === 'transfer') {
        await page.getByRole('button', { name: 'Transfer', exact: true }).click();
    }

    await page.fill('#amount', params.amount);
    if (params.description) {
        await page.fill('#description', params.description);
    }

    if (params.type === 'transfer') {
        if (params.fromWallet) await page.selectOption('#fromWallet', { label: params.fromWallet });
        if (params.toWallet) await page.selectOption('#toWallet', { label: params.toWallet });
    } else if (params.wallet) {
        await page.selectOption('#wallet', { label: params.wallet });
    }

    await page.getByRole('button', { name: /Save Transaction/i }).click();
    await page.waitForSelector('#transaction-form', { state: 'hidden' });
}

