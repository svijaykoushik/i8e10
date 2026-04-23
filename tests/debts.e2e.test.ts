import { test, expect } from '@playwright/test';
import { SetupPage } from './pom/SetupPage';
import { DebtsPage } from './pom/DebtsPage';
import { TransactionsPage } from './pom/TransactionsPage';

test.describe('Debts View Exhaustive E2E', () => {
  let setupPage: SetupPage;
  let debtsPage: DebtsPage;
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    setupPage = new SetupPage(page);
    debtsPage = new DebtsPage(page);
    transactionsPage = new TransactionsPage(page);

    await setupPage.fullSetup();
  });

  test('should perform exhaustive debt operations', async ({ page }) => {
    test.setTimeout(90000); // This is a long E2E flow
    
    const wallet1 = 'Cash / ரொக்கம்';

    // 1. Navigate to Debts tab
    await debtsPage.navigateTo('Debts');

    // 2. Add Lent debt of 5000 WITH create-transaction
    await debtsPage.createDebt({
      type: 'Lent',
      amount: '5000',
      person: 'Alice Lent',
      description: 'Lent for rent',
      createTransaction: true,
      wallet: wallet1
    });

    // Assert it appears in the list
    await expect(page.locator('text=Lent to Alice Lent')).toBeVisible();

    // The transaction should reflect in balance (which is now -5000)
    await debtsPage.navigateTo('Transactions');
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/-₹5,000\.00/, { timeout: 5000 });

    // Go back to Debts
    await debtsPage.navigateTo('Debts');

    // 3. Add Owed debt of 2000 WITHOUT create-transaction
    await debtsPage.createDebt({
      type: 'Owed',
      amount: '2000',
      person: 'Bob Owed',
      description: 'Borrowed for groceries',
      createTransaction: false
    });

    await expect(page.locator('text=Owed to Bob Owed')).toBeVisible();

    // 4. Edit the Owed debt to 3000
    await debtsPage.editDebt('Bob Owed', '3000');
    
    // The amount should now be 3000
    await expect(page.locator('li').filter({ hasText: 'Bob Owed' }).locator('text=₹3,000.00')).toBeVisible();

    // 5. Add installment of 1000 to the Lent debt (Alice) WITH transaction
    await debtsPage.addInstallment('Alice Lent', {
      amount: '1000',
      note: 'First payment',
      wallet: wallet1
    });
    
    // Verify paid amount updated
    await expect(page.locator('li').filter({ hasText: 'Alice Lent' })).toContainText('Paid: ₹1,000.00');

    // 6. Overpay the Owed debt (Bob)
    await debtsPage.addInstallment('Bob Owed', {
      amount: '4000',
      createSurplus: true
    });
    
    // Bob debt should be settled
    await expect(page.locator('li').filter({ hasText: 'Bob Owed' }).locator('text=Settled')).toBeVisible();
    
    // A new Lent debt of 1000 should be created (surplus from Owed becomes Lent)
    await expect(page.locator('li').filter({ hasText: 'Lent to Bob Owed' })).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Lent to Bob Owed' }).locator('text=₹1,000.00')).toBeVisible();

    // 7. Edit an installment (expand Alice debt, edit the 1000 installment to 1500)
    await debtsPage.toggleExpand('Alice Lent');
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
    await debtsPage.forgiveDebt('Alice Lent');
    await expect(page.locator('li').filter({ hasText: 'Alice Lent' }).locator('text=Forgiven')).toBeVisible();

    // 9. Delete a debt (the new surplus one)
    await debtsPage.deleteDebt('Lent to Bob Owed');
    
    // Verify it's gone
    await expect(page.locator('li').filter({ hasText: 'Lent to Bob Owed' })).toBeHidden();
  });
});

