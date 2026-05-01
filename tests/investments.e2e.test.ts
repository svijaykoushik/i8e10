import { test, expect } from '@playwright/test';
import { SetupPage } from './pom/SetupPage';
import { InvestmentsPage } from './pom/InvestmentsPage';

test.describe('Investments View E2E', () => {
  let setupPage: SetupPage;
  let investmentsPage: InvestmentsPage;

  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    setupPage = new SetupPage(page);
    investmentsPage = new InvestmentsPage(page);

    await setupPage.fullSetup();
    
    // Navigate to Investments tab
    await investmentsPage.navigateTo('Investments');
  });

  test('should perform exhaustive investment operations', async ({ page }) => {
    test.setTimeout(120000);
    const wallet1 = 'Cash / ரொக்கம்';

    // 1. Create Investment WITH transaction logging
    await investmentsPage.createInvestment({
      name: 'Mutual Fund A',
      type: 'Equity',
      initialAmount: '10000',
      wallet: wallet1
    });

    await expect(page.locator('text=Mutual Fund A')).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Mutual Fund A' }).getByText('₹10,000.00', { exact: true })).toBeVisible();

    // Verify balance decreased
    await investmentsPage.navigateTo('Transactions');
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/-₹10,000\.00/);
    await investmentsPage.navigateTo('Investments');

    // 2. Update Investment Value (Growth)
    await investmentsPage.updateValue('Mutual Fund A', '11000');
    
    await expect(page.locator('li').filter({ hasText: 'Mutual Fund A' }).getByText('₹11,000.00', { exact: true })).toBeVisible();
    await expect(page.locator('text=+₹1,000.00')).toBeVisible(); // Profit indicator

    // 3. Update Investment Value (Loss)
    await investmentsPage.updateValue('Mutual Fund A', '9500');
    
    await expect(page.locator('li').filter({ hasText: 'Mutual Fund A' }).getByText('₹9,500.00', { exact: true })).toBeVisible();
    await expect(page.locator('text=-₹500.00')).toBeVisible(); // Loss indicator

    // 4. Update Investment (Edit)
    await investmentsPage.editInvestment('Mutual Fund A', 'Nifty Index Fund');
    await expect(page.locator('text=Nifty Index Fund')).toBeVisible();

    // 5. Topup Investment (Contribution) WITH logging
    await investmentsPage.addTransaction('Nifty Index Fund', {
      type: 'Contribution',
      amount: '5000',
      wallet: wallet1
    });
    
    await expect(page.locator('li').filter({ hasText: 'Nifty Index Fund' }).getByText('₹14,500.00', { exact: true })).toBeVisible();

    // 6. Sell Partial Investment (Withdrawal) WITHOUT logging
    await investmentsPage.addTransaction('Nifty Index Fund', {
      type: 'Withdrawal',
      amount: '2000',
      createTransaction: false
    });
    
    await expect(page.locator('li').filter({ hasText: 'Nifty Index Fund' }).getByText('₹12,500.00', { exact: true })).toBeVisible();

    // 7. Add Dividend WITH logging
    await investmentsPage.addTransaction('Nifty Index Fund', {
      type: 'Dividend',
      amount: '500',
      wallet: wallet1
    });
    
    // Investment value should stay 12,500.00 (dividend is a payout)
    await expect(page.locator('li').filter({ hasText: 'Nifty Index Fund' }).getByText('₹12,500.00', { exact: true })).toBeVisible();

    // 8. Sell Full Investment WITH logging
    await investmentsPage.sellInvestment('Nifty Index Fund', wallet1);
    
    await expect(page.locator('text=Sold')).toBeVisible();

    // Verify final balance
    await investmentsPage.navigateTo('Transactions');
    await expect(page.locator('.text-5xl.font-bold')).toContainText(/-₹2,000\.00/);
    await investmentsPage.navigateTo('Investments');

    // 9. Create another investment WITHOUT logging
    await investmentsPage.createInvestment({
      name: 'Temporary Fund',
      type: 'Debt',
      initialAmount: '1000',
      createTransaction: false
    });
    
    await expect(page.locator('li').filter({ hasText: 'Temporary Fund' })).toBeVisible();

    // 10. Delete Investment
    await investmentsPage.deleteInvestment('Temporary Fund');
    
    await expect(page.locator('li').filter({ hasText: 'Temporary Fund' })).toBeHidden();

  });
});

