import { test, expect } from '@playwright/test';
import { getTotalBalance, getWalletBalance } from './helpers';

test.describe('Investments View E2E', () => {
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

    // Password Setup Flow
    const understandBtn = page.getByRole('button', { name: /I Understand, Continue/i });
    await understandBtn.waitFor({ state: 'visible', timeout: 15000 });
    await understandBtn.click();

    await page.fill('#new-password', 'StrongPassword123!');
    await page.fill('#confirm-password', 'StrongPassword123!');
    const setPasswordBtn = page.getByRole('button', { name: /Set Password & Secure Data/i });
    await expect(setPasswordBtn).toBeEnabled({ timeout: 5000 });
    await setPasswordBtn.click();

    // Recovery Phrase Flow
    await page.getByLabel(/I have written down my recovery phrase/i).check();
    const finishSetupBtn = page.getByRole('button', { name: /Finish Setup/i });
    await expect(finishSetupBtn).toBeEnabled({ timeout: 5000 });
    await finishSetupBtn.click();

    // Onboarding Flow
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
    } catch (e) {}

    // Ensure we are on the main view
    await expect(page.locator('text=Total Balance / மொத்த இருப்பு')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Investments tab
    await page.getByRole('button', { name: 'Investments', exact: true }).click();
  });

  test('should perform exhaustive investment operations', async ({ page }) => {
    test.setTimeout(120000);
    const wallet1 = 'Cash / ரொக்கம்';

    // 1. Create Investment WITH transaction logging
    await page.getByLabel(/Add Investment/i).click();
    await page.waitForSelector('#investment-form', { state: 'visible' });
    
    await page.fill('#inv-name', 'Mutual Fund A');
    await page.fill('#inv-type', 'Equity');
    await page.fill('#inv-initial', '10000');
    // Transaction logging is enabled by default in the component
    await page.selectOption('#wallet-investment', { label: wallet1 });
    await page.getByRole('button', { name: /Save Investment/i }).click();
    await page.waitForSelector('#investment-form', { state: 'hidden' });

    await expect(page.locator('text=Mutual Fund A')).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Mutual Fund A' }).getByText('₹10,000.00', { exact: true })).toBeVisible();

    // Verify balance decreased
    await page.getByRole('button', { name: 'Transactions', exact: true }).click();
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/-₹10,000\.00/);
    await page.getByRole('button', { name: 'Investments', exact: true }).click();

    // 2. Update Investment Value (Growth)
    const mfAMenu = page.locator('li').filter({ hasText: 'Mutual Fund A' }).locator('button[aria-haspopup="true"]');
    await mfAMenu.click();
    await page.getByRole('menuitem', { name: 'Update Value' }).click();
    
    await page.waitForSelector('#update-investment-form', { state: 'visible' });
    await page.fill('#currentValue', '11000');
    await page.getByRole('button', { name: /Update Value/i }).click();
    await page.waitForSelector('#update-investment-form', { state: 'hidden' });
    
    await expect(page.locator('li').filter({ hasText: 'Mutual Fund A' }).getByText('₹11,000.00', { exact: true })).toBeVisible();
    await expect(page.locator('text=+₹1,000.00')).toBeVisible(); // Profit indicator

    // 3. Update Investment Value (Loss)
    await mfAMenu.click();
    await page.getByRole('menuitem', { name: 'Update Value' }).click();
    await page.fill('#currentValue', '9500');
    await page.getByRole('button', { name: /Update Value/i }).click();

    
    await expect(page.locator('li').filter({ hasText: 'Mutual Fund A' }).getByText('₹9,500.00', { exact: true })).toBeVisible();
    await expect(page.locator('text=-₹500.00')).toBeVisible(); // Loss indicator

    // 4. Update Investment (Edit)
    await mfAMenu.click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.fill('#inv-name', 'Nifty Index Fund');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.locator('text=Nifty Index Fund')).toBeVisible();

    // 5. Topup Investment (Contribution) WITH logging
    const nifMenu = page.locator('li').filter({ hasText: 'Nifty Index Fund' }).locator('button[aria-haspopup="true"]');
    await nifMenu.click();
    await page.getByRole('menuitem', { name: 'Add Transaction' }).click();
    
    await page.waitForSelector('#investment-tx-form', { state: 'visible' });
    // Default is Contribution
    await page.fill('#inv-tx-amount', '5000');
    await page.selectOption('#wallet-investment-tx', { label: wallet1 });
    await page.getByRole('button', { name: /Save Transaction/i }).click();
    
    await expect(page.locator('li').filter({ hasText: 'Nifty Index Fund' }).getByText('₹14,500.00', { exact: true })).toBeVisible();

    // 6. Sell Partial Investment (Withdrawal) WITHOUT logging
    await nifMenu.click();
    await page.getByRole('menuitem', { name: 'Add Transaction' }).click();
    await page.getByRole('button', { name: 'Withdrawal', exact: true }).click();
    await page.fill('#inv-tx-amount', '2000');
    // Disable logging
    await page.locator('label[for="create-transaction-investment"]').click();
    await page.getByRole('button', { name: /Save Transaction/i }).click();
    
    await expect(page.locator('li').filter({ hasText: 'Nifty Index Fund' }).getByText('₹12,500.00', { exact: true })).toBeVisible();

    // 7. Add Dividend WITH logging
    await nifMenu.click();
    await page.getByRole('menuitem', { name: 'Add Transaction' }).click();
    await page.getByRole('button', { name: 'Dividend', exact: true }).click();
    await page.fill('#inv-tx-amount', '500');
    await page.selectOption('#wallet-investment-tx', { label: wallet1 });
    await page.getByRole('button', { name: /Save Transaction/i }).click();
    
    // Investment value should stay 12,500.00 (dividend is a payout)
    await expect(page.locator('li').filter({ hasText: 'Nifty Index Fund' }).getByText('₹12,500.00', { exact: true })).toBeVisible();

    // 8. Sell Full Investment WITH logging
    await nifMenu.click();
    await page.getByRole('menuitem', { name: 'Sell Investment' }).click();
    await page.waitForSelector('text=Confirm Sale of Investment');
    await page.selectOption('#wallet-sell', { label: wallet1 });
    await page.getByRole('button', { name: /Yes, Confirm Sale/i }).click();
    
    await expect(page.locator('text=Sold')).toBeVisible();

    // Verify final balance
    await page.getByRole('button', { name: 'Transactions', exact: true }).click();
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/-₹2,000\.00/);
    await page.getByRole('button', { name: 'Investments', exact: true }).click();

    // 9. Create another investment WITHOUT logging
    await page.getByLabel(/Add Investment/i).click();
    await page.fill('#inv-name', 'Temporary Fund');
    await page.fill('#inv-type', 'Debt');
    await page.fill('#inv-initial', '1000');
    await page.locator('label[for="create-transaction-investment"]').click(); // Disable logging
    await page.getByRole('button', { name: /Save Investment/i }).click();
    
    await expect(page.locator('li').filter({ hasText: 'Temporary Fund' })).toBeVisible();

    // 10. Delete Investment
    const tempMenu = page.locator('li').filter({ hasText: 'Temporary Fund' }).locator('button[aria-haspopup="true"]');
    await tempMenu.click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Yes, Delete' }).click();
    
    await expect(page.locator('li').filter({ hasText: 'Temporary Fund' })).toBeHidden();

  });
});
