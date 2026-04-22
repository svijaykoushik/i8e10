import { test, expect } from '@playwright/test';
import { getTotalBalance, getWalletBalance, createTransaction } from './helpers';

test.describe('Double-Entry Accounting Flows', () => {
  const wallet1 = 'Cash / ரொக்கம்';
  const wallet2 = 'Bank / வங்கி';

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(120000); // High timeout for setup

    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.clear();
      const dbName = 'FinanceDB';
      const request = window.indexedDB.deleteDatabase(dbName);
      await new Promise((resolve, reject) => {
        request.onsuccess = resolve;
        request.onerror = reject;
        request.onblocked = resolve; // Continue anyway if blocked
      });
    });

    await page.reload();

    // Setup password and recovery phrase
    await page.getByRole('button', { name: /I Understand, Continue/i }).click();
    await page.fill('#new-password', 'StrongPassword123!');
    await page.fill('#confirm-password', 'StrongPassword123!');
    await page.getByRole('button', { name: /Set Password & Secure Data/i }).click();
    await page.getByLabel(/I have written down my recovery phrase/i).check();
    await page.getByRole('button', { name: /Finish Setup/i }).click();
    
    // Skip guide
    try {
      await page.getByRole('button', { name: /Skip/i }).waitFor({ state: 'visible', timeout: 10000 });
      await page.getByRole('button', { name: /Skip/i }).click();
    } catch (e) {}
  });

  test('Creating expense transaction in different wallets should be correctly attributed to respective wallets', async ({ page }) => {
    await createTransaction(page, { type: 'income', amount: '5000', description: 'Initial Cash', wallet: wallet1 });
    await createTransaction(page, { type: 'income', amount: '5000', description: 'Initial Bank', wallet: wallet2 });

    await createTransaction(page, { type: 'expense', amount: '1000', description: 'Coffee', wallet: wallet1 });
    await createTransaction(page, { type: 'expense', amount: '2000', description: 'Rent', wallet: wallet2 });

    const cashBalance = await getWalletBalance(page, wallet1);
    const bankBalance = await getWalletBalance(page, wallet2);

    expect(cashBalance).toBe(4000);
    expect(bankBalance).toBe(3000);
    expect(await getTotalBalance(page)).toBe(7000);
  });

  test('Creating income transaction in different wallets should be correctly attributed to respective wallets', async ({ page }) => {
    await createTransaction(page, { type: 'income', amount: '2000', description: 'Gift A', wallet: wallet1 });
    await createTransaction(page, { type: 'income', amount: '3000', description: 'Gift B', wallet: wallet2 });

    const cashBalance = await getWalletBalance(page, wallet1);
    const bankBalance = await getWalletBalance(page, wallet2);

    expect(cashBalance).toBe(2000);
    expect(bankBalance).toBe(3000);
    expect(await getTotalBalance(page)).toBe(5000);
  });

  test('Creating transfer transaction should create a corresponding expense record in source wallet and income record in destination wallet', async ({ page }) => {
    await createTransaction(page, { type: 'income', amount: '5000', description: 'Initial', wallet: wallet1 });
    
    await createTransaction(page, { type: 'transfer', amount: '2000', description: 'test_transfer', fromWallet: wallet1, toWallet: wallet2 });

    const cashBalance = await getWalletBalance(page, wallet1);
    const bankBalance = await getWalletBalance(page, wallet2);

    expect(cashBalance).toBe(3000);
    expect(bankBalance).toBe(2000);
    expect(await getTotalBalance(page)).toBe(5000);

    await page.waitForTimeout(1000);

    const items = page.locator('.transaction-item');
    const transferItems = items.filter({ hasText: 'test_transfer' });
    
    await expect(transferItems).toHaveCount(2);

    const expenseLeg = transferItems.filter({ hasText: /- ₹/ });
    const incomeLeg = transferItems.filter({ hasText: /\+ ₹/ });
    
    await expect(expenseLeg).toBeVisible();
    await expect(incomeLeg).toBeVisible();
  });

  test('Reconcile should correctly adjust the balances', async ({ page }) => {
    await createTransaction(page, { type: 'income', amount: '5000', description: 'Initial', wallet: wallet1 });
    
    await createTransaction(page, { type: 'reconcile', amount: '4500', wallet: wallet1 });
    
    const cashBalance = await getWalletBalance(page, wallet1);
    expect(cashBalance).toBe(4500);
    expect(await getTotalBalance(page)).toBe(4500);

    await createTransaction(page, { type: 'reconcile', amount: '5500', wallet: wallet1 });
    const cashBalance2 = await getWalletBalance(page, wallet1);
    expect(cashBalance2).toBe(5500);
    expect(await getTotalBalance(page)).toBe(5500);
  });
});
