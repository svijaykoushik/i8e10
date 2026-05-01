import { test, expect } from '@playwright/test';
import { SetupPage } from './pom/SetupPage';
import { TransactionsPage } from './pom/TransactionsPage';

test.describe('Double-Entry Accounting Flows', () => {
  const wallet1 = 'Cash / ரொக்கம்';
  const wallet2 = 'Bank / வங்கி';

  let setupPage: SetupPage;
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(120000); // High timeout for setup

    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    setupPage = new SetupPage(page);
    transactionsPage = new TransactionsPage(page);

    await setupPage.fullSetup();
  });

  test('Creating expense transaction in different wallets should be correctly attributed to respective wallets', async ({ page }) => {
    await transactionsPage.createTransaction({ type: 'income', amount: '5000', description: 'Initial Cash', wallet: wallet1 });
    await transactionsPage.createTransaction({ type: 'income', amount: '5000', description: 'Initial Bank', wallet: wallet2 });

    await transactionsPage.createTransaction({ type: 'expense', amount: '1000', description: 'Coffee', wallet: wallet1 });
    await transactionsPage.createTransaction({ type: 'expense', amount: '2000', description: 'Rent', wallet: wallet2 });

    const cashBalance = await transactionsPage.getWalletBalance(wallet1);
    const bankBalance = await transactionsPage.getWalletBalance(wallet2);

    expect(cashBalance).toBe(4000);
    expect(bankBalance).toBe(3000);
    expect(await transactionsPage.getTotalBalance()).toBe(7000);
  });

  test('Creating income transaction in different wallets should be correctly attributed to respective wallets', async ({ page }) => {
    await transactionsPage.createTransaction({ type: 'income', amount: '2000', description: 'Gift A', wallet: wallet1 });
    await transactionsPage.createTransaction({ type: 'income', amount: '3000', description: 'Gift B', wallet: wallet2 });

    const cashBalance = await transactionsPage.getWalletBalance(wallet1);
    const bankBalance = await transactionsPage.getWalletBalance(wallet2);

    expect(cashBalance).toBe(2000);
    expect(bankBalance).toBe(3000);
    expect(await transactionsPage.getTotalBalance()).toBe(5000);
  });

  test('Creating transfer transaction should create a corresponding expense record in source wallet and income record in destination wallet', async ({ page }) => {
    await transactionsPage.createTransaction({ type: 'income', amount: '5000', description: 'Initial', wallet: wallet1 });
    
    await transactionsPage.createTransaction({ type: 'transfer', amount: '2000', description: 'test_transfer', fromWallet: wallet1, toWallet: wallet2 });

    const cashBalance = await transactionsPage.getWalletBalance(wallet1);
    const bankBalance = await transactionsPage.getWalletBalance(wallet2);

    expect(cashBalance).toBe(3000);
    expect(bankBalance).toBe(2000);
    expect(await transactionsPage.getTotalBalance()).toBe(5000);

    await page.waitForTimeout(1000);

    await transactionsPage.verifyTransactionCount('test_transfer', 2);

    const items = page.locator('.transaction-item');
    const transferItems = items.filter({ hasText: 'test_transfer' });
    
    const expenseLeg = transferItems.filter({ hasText: /- ₹/ });
    const incomeLeg = transferItems.filter({ hasText: /\+ ₹/ });
    
    await expect(expenseLeg).toBeVisible();
    await expect(incomeLeg).toBeVisible();
  });

  test('Reconcile should correctly adjust the balances', async ({ page }) => {
    await transactionsPage.createTransaction({ type: 'income', amount: '5000', description: 'Initial', wallet: wallet1 });
    
    await transactionsPage.createTransaction({ type: 'reconcile', amount: '4500', wallet: wallet1 });
    
    const cashBalance = await transactionsPage.getWalletBalance(wallet1);
    expect(cashBalance).toBe(4500);
    expect(await transactionsPage.getTotalBalance()).toBe(4500);

    await transactionsPage.createTransaction({ type: 'reconcile', amount: '5500', wallet: wallet1 });
    const cashBalance2 = await transactionsPage.getWalletBalance(wallet1);
    expect(cashBalance2).toBe(5500);
    expect(await transactionsPage.getTotalBalance()).toBe(5500);
  });
});

