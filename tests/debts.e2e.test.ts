import { test, expect } from '@playwright/test';
import { getTotalBalance, getWalletBalance } from './helpers';

test.describe('Debts View Exhaustive E2E', () => {
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
      // Continue anyway
    }
  });

  test('should perform exhaustive debt operations', async ({ page }) => {
    test.setTimeout(90000); // This is a long E2E flow
    // Ensure we are on the main view
    await expect(page.locator('text=Total Balance / மொத்த இருப்பு')).toBeVisible({ timeout: 10000 });

    const wallet1 = 'Cash / ரொக்கம்';

    // 1. Navigate to Debts tab
    await page.getByRole('button', { name: 'Debts', exact: true }).click();

    // 2. Add Lent debt of 5000 WITH create-transaction
    await page.getByLabel(/Add Debt/i).click();
    await page.waitForSelector('#debt-form', { state: 'visible' });
    
    // Type is LENT by default
    await page.fill('#amount', '5000');
    await page.fill('#person', 'Alice Lent');
    await page.fill('#description', 'Lent for rent');
    
    // Check "Deduct from balance"
    await page.locator('label[for="create-transaction"]').click();
    await page.selectOption('#wallet', { label: wallet1 });
    
    await page.getByRole('button', { name: /Save Record/i }).click();
    await page.waitForSelector('#debt-form', { state: 'hidden' });

    // Assert it appears in the list
    await expect(page.locator('text=Lent to Alice Lent')).toBeVisible();

    // The transaction should reflect in balance (which is now -5000)
    // Go to Transactions to check balance
    await page.getByRole('button', { name: 'Transactions', exact: true }).click();
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/-₹5,000\.00/, { timeout: 5000 });

    // Go back to Debts
    await page.getByRole('button', { name: 'Debts', exact: true }).click();

    // 3. Add Owed debt of 2000 WITHOUT create-transaction
    await page.getByLabel(/Add Debt/i).click();
    await page.waitForSelector('#debt-form', { state: 'visible' });
    
    // Switch to Owed
    await page.getByRole('button', { name: /Owed \/ வாங்கியது/i }).click();
    await page.fill('#amount', '2000');
    await page.fill('#person', 'Bob Owed');
    await page.fill('#description', 'Borrowed for groceries');
    
    // Don't check Add to balance
    await page.getByRole('button', { name: /Save Record/i }).click();
    await page.waitForSelector('#debt-form', { state: 'hidden' });

    await expect(page.locator('text=Owed to Bob Owed')).toBeVisible();

    // 4. Edit the Owed debt to 3000
    const bobDebtMenu = page.locator('li').filter({ hasText: 'Bob Owed' }).locator('button[aria-haspopup="true"]');
    await bobDebtMenu.click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    
    await page.waitForSelector('#debt-form', { state: 'visible' });
    await page.fill('#amount', '3000');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await page.waitForSelector('#debt-form', { state: 'hidden' });
    
    // The amount should now be 3000
    await expect(page.locator('li').filter({ hasText: 'Bob Owed' }).locator('text=₹3,000.00')).toBeVisible();

    // 5. Add installment of 1000 to the Lent debt (Alice) WITH transaction
    const aliceDebtMenu = page.locator('li').filter({ hasText: 'Alice Lent' }).locator('button[aria-haspopup="true"]');
    await aliceDebtMenu.click();
    await page.getByRole('menuitem', { name: 'Add Installment' }).click();
    
    await page.waitForSelector('#installment-form', { state: 'visible' });
    await page.fill('#inst-amount', '1000');
    await page.fill('#inst-note', 'First payment');
    // Transaction should be enabled by default
    await page.selectOption('#wallet-inst', { label: wallet1 });
    await page.getByRole('button', { name: /Save Installment/i }).click();
    await page.waitForSelector('#installment-form', { state: 'hidden' });
    
    // Verify paid amount updated
    await expect(page.locator('li').filter({ hasText: 'Alice Lent' })).toContainText('Paid: ₹1,000.00');

    // 6. Overpay the Owed debt (Bob)
    await bobDebtMenu.click();
    await page.getByRole('menuitem', { name: 'Add Installment' }).click();
    
    await page.waitForSelector('#installment-form', { state: 'visible' });
    // Total is 3000, we pay 4000
    await page.fill('#inst-amount', '4000');
    
    // Should see overpayment warning and check create surplus
    await expect(page.locator('text=Overpayment!')).toBeVisible();
    await page.locator('label[for="create-surplus"]').click();
    
    await page.getByRole('button', { name: /Save Installment/i }).click();
    await page.waitForSelector('#installment-form', { state: 'hidden' });
    
    // Bob debt should be settled
    await expect(page.locator('li').filter({ hasText: 'Bob Owed' }).locator('text=Settled')).toBeVisible();
    
    // A new Lent debt of 1000 should be created (surplus from Owed becomes Lent)
    await expect(page.locator('li').filter({ hasText: 'Lent to Bob Owed' })).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Lent to Bob Owed' }).locator('text=₹1,000.00')).toBeVisible();

    // 7. Edit an installment (expand Alice debt, edit the 1000 installment to 1500)
    await page.locator('text=Lent to Alice Lent').first().click(); // toggle expand
    await expect(page.locator('text=First payment')).toBeVisible();
    
    const instRow = page.locator('.space-y-2 > div').filter({ hasText: 'First payment' });
    await instRow.locator('button').first().click();
    await instRow.getByRole('button', { name: 'Edit' }).click();
    
    await page.waitForSelector('#installment-form', { state: 'visible' });
    await page.fill('#inst-amount', '1500');
    await page.getByRole('button', { name: /Save Installment/i }).click();
    await page.waitForSelector('#installment-form', { state: 'hidden' });
    
    // Verify paid amount updated
    await expect(page.locator('li').filter({ hasText: 'Alice Lent' })).toContainText('Paid: ₹1,500.00');

    // 8. Forgive the remaining Lent debt (Alice)
    // Open menu again
    await aliceDebtMenu.click();
    await page.getByRole('menuitem', { name: 'Forgive debt' }).click();
    
    // Confirm forgive
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Wait for modal to disappear
    await page.waitForTimeout(500); // Sometimes modal fading takes a moment
    
    await expect(page.locator('li').filter({ hasText: 'Alice Lent' }).locator('text=Forgiven')).toBeVisible();

    // 9. Delete a debt (the new surplus one)
    const surplusMenu = page.locator('li').filter({ hasText: 'Lent to Bob Owed' }).locator('button[aria-haspopup="true"]');
    await surplusMenu.click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    
    // Confirm delete
    await page.getByRole('button', { name: 'Yes, Delete' }).click();
    
    // Verify it's gone
    await expect(page.locator('li').filter({ hasText: 'Lent to Bob Owed' })).toBeHidden();
  });
});
