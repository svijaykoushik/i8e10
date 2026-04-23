import { test, expect } from '@playwright/test';
import { SetupPage } from './pom/SetupPage';
import { TransactionsPage } from './pom/TransactionsPage';

test.describe('Transaction View Exhaustive E2E', () => {
  let setupPage: SetupPage;
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    setupPage = new SetupPage(page);
    transactionsPage = new TransactionsPage(page);

    await setupPage.fullSetup();
  });


  test('should log expense, income, and transfer and verify balances', async ({ page }) => {
    // Initial balances should be 0
    await expect(page.locator('.text-5xl.font-bold')).toContainText('₹0.00');

    // Default wallets are usually "Cash / ரொக்கம்" and "Bank / வங்கி"
    const wallet1 = 'Cash / ரொக்கம்';
    const wallet2 = 'Bank / வங்கி';

    // --- STEP 1: Log Income ---
    await transactionsPage.createTransaction({
      type: 'income',
      amount: '10000',
      description: 'Monthly Salary',
      wallet: wallet1
    });

    await expect(page.locator('.text-5xl.font-bold')).toContainText(/10,000\.00/, { timeout: 10000 });

    
    // --- STEP 2: Log Expense ---
    await transactionsPage.createTransaction({
      type: 'expense',
      amount: '2000',
      description: 'Grocery Shopping',
      wallet: wallet1
    });

    await expect(page.locator('.text-5xl.font-bold')).toContainText(/8,000\.00/, { timeout: 10000 });

    // --- STEP 3: Log Transfer ---
    await transactionsPage.createTransaction({
      type: 'transfer',
      amount: '3000',
      description: 'Transfer to Bank',
      fromWallet: wallet1,
      toWallet: wallet2
    });


    // Global balance should still be 8000
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/8,000\.00/, { timeout: 10000 });

    // --- STEP 4: Verify Individual Wallet Balances ---
    
    // Wallet 1 (Cash) balance: 10000 (Income) - 2000 (Expense) - 3000 (Transfer Out) = 5000
    const balance1 = await transactionsPage.getWalletBalance(wallet1);
    expect(balance1).toBe(5000);

    // Wallet 2 (Bank) balance: 0 (Initial) + 3000 (Transfer In) = 3000
    const balance2 = await transactionsPage.getWalletBalance(wallet2);
    expect(balance2).toBe(3000);

    // Global balance: 5000 + 3000 = 8000
    const globalBalance = await transactionsPage.getTotalBalance();
    expect(globalBalance).toBe(8000);

  });
});

