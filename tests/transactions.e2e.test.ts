import { test, expect } from '@playwright/test';

test.describe('Transaction View Exhaustive E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Clear IndexedDB and LocalStorage to ensure a clean state

    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.clear();
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          // Close all connections before deleting
          const request = window.indexedDB.open(db.name);
          request.onsuccess = (event: any) => {
            const d = event.target.result;
            d.close();
            window.indexedDB.deleteDatabase(db.name);
          };
        }
      }
    });
    await page.reload();

    // Wait for the loader to disappear (if any)
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // 1. Password Setup Flow
    const understandBtn = page.getByRole('button', { name: /I Understand, Continue/i });
    await understandBtn.waitFor({ state: 'visible', timeout: 15000 });
    await understandBtn.click();

    await page.fill('#new-password', 'StrongPassword123!');
    await page.fill('#confirm-password', 'StrongPassword123!');
    const setPasswordBtn = page.getByRole('button', { name: /Set Password & Secure Data/i });
    await expect(setPasswordBtn).toBeEnabled({ timeout: 5000 });
    await setPasswordBtn.click();

    // 2. Recovery Phrase Flow
    await page.getByLabel(/I have written down my recovery phrase/i).check();
    const finishSetupBtn = page.getByRole('button', { name: /Finish Setup/i });
    await expect(finishSetupBtn).toBeEnabled({ timeout: 5000 });
    await finishSetupBtn.click();


    // 3. Onboarding Flow
    // The onboarding guide might appear, or we might go straight to the main view.
    const skipButton = page.getByRole('button', { name: /Skip/i });
    const mainViewMarker = page.locator('text=Total Balance / மொத்த இருப்பு');
    
    try {
      await Promise.race([
        skipButton.waitFor({ state: 'visible', timeout: 10000 }),
        mainViewMarker.waitFor({ state: 'visible', timeout: 10000 })
      ]);
      
      if (await skipButton.isVisible()) {
        await skipButton.click();
      }
    } catch (e) {
      // Continue anyway, maybe we are already in the main view
    }
  });


  test('should log expense, income, and transfer and verify balances', async ({ page }) => {
    // Initial balances should be 0
    await expect(page.locator('.text-5xl.font-bold')).toContainText('₹0.00');

    // Default wallets are usually "Cash / ரொக்கம்" and "Bank / வங்கி"
    const wallet1 = 'Cash / ரொக்கம்';
    const wallet2 = 'Bank / வங்கி';

    // Helper to get total balance
    const getTotalBalance = async () => {
      const text = await page.locator('.text-5xl.font-bold').textContent();
      return parseFloat(text?.replace(/[^\d.-]/g, '') || '0');
    };

    // Helper to get wallet balance
    const getWalletBalance = async (walletName: string) => {
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
        
        const balance = await getTotalBalance();
        
        // Reset wallet filter for next operations
        await page.getByLabel('Open filters').click();
        await page.waitForSelector('#filter-modal', { state: 'visible' });
        await page.selectOption('#filter-wallet', 'all');
        await page.getByRole('button', { name: /Apply Filters/i }).click();
        await page.waitForSelector('#filter-modal', { state: 'hidden' });
        await page.waitForTimeout(1000);
        
        return balance;
    };






    // --- STEP 1: Log Income ---
    await page.getByLabel(/Add Expense/i).click();
    await page.waitForSelector('#transaction-form', { state: 'visible' });
    await page.getByRole('button', { name: 'Income', exact: true }).click();
    await page.fill('#amount', '10000');
    await page.fill('#description', 'Monthly Salary');
    
    // Check available wallets in the dropdown
    const walletsOptions = await page.locator('#wallet option').allTextContents();
    console.log('Available wallets in Income mode:', walletsOptions);
    
    await page.selectOption('#wallet', { label: wallet1 });
    await page.getByRole('button', { name: /Save Transaction/i }).click();
    await page.waitForSelector('#transaction-form', { state: 'hidden' });

    const balanceText1 = await page.locator('.text-5xl.font-bold').textContent();
    console.log('Balance after Step 1:', balanceText1);
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/10,000\.00/, { timeout: 10000 });

    
    // --- STEP 2: Log Expense ---
    await page.getByLabel(/Add Expense/i).click();
    await page.waitForSelector('#transaction-form', { state: 'visible' });
    // Default is Expense, no need to click mode
    await page.fill('#amount', '2000');
    await page.fill('#description', 'Grocery Shopping');
    await page.selectOption('#wallet', { label: wallet1 });
    await page.getByRole('button', { name: /Save Transaction/i }).click();
    await page.waitForSelector('#transaction-form', { state: 'hidden' });

    await expect(page.locator('.text-5xl.font-bold')).toContainText(/8,000\.00/, { timeout: 10000 });
    const balanceText2 = await page.locator('.text-5xl.font-bold').textContent();
    console.log('Balance after Step 2:', balanceText2);

    // --- STEP 3: Log Transfer ---
    await page.getByLabel(/Add Expense/i).click();
    await page.waitForSelector('#transaction-form', { state: 'visible' });
    await page.getByRole('button', { name: 'Transfer', exact: true }).click();
    
    // In transfer mode, amount field remains, but wallet select changes to fromWallet/toWallet
    await page.fill('#amount', '3000');
    await page.fill('#description', 'Transfer to Bank');
    
    const fromWallets = await page.locator('#fromWallet option').allTextContents();
    console.log('Available fromWallets:', fromWallets);

    await page.selectOption('#fromWallet', { label: wallet1 });
    await page.selectOption('#toWallet', { label: wallet2 });
    await page.getByRole('button', { name: /Save Transaction/i }).click();
    await page.waitForSelector('#transaction-form', { state: 'hidden' });


    // Global balance should still be 8000
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/8,000\.00/, { timeout: 10000 });

    // --- STEP 4: Verify Individual Wallet Balances ---
    
    // Wallet 1 (Cash) balance: 10000 (Income) - 2000 (Expense) - 3000 (Transfer Out) = 5000
    const balance1 = await getWalletBalance(wallet1);
    expect(balance1).toBe(5000);

    // Wallet 2 (Bank) balance: 0 (Initial) + 3000 (Transfer In) = 3000
    const balance2 = await getWalletBalance(wallet2);
    expect(balance2).toBe(3000);

    // Global balance: 5000 + 3000 = 8000
    // getWalletBalance already resets to 'all' at the end
    const globalBalance = await getTotalBalance();
    expect(globalBalance).toBe(8000);

  });
});
