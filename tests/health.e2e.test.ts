import { test, expect } from '@playwright/test';
import { SetupPage } from './pom/SetupPage';
import { TransactionsPage } from './pom/TransactionsPage';
import { DebtsPage } from './pom/DebtsPage';
import { HealthPage } from './pom/HealthPage';

test.describe('Financial Health E2E Tests', () => {
  let setupPage: SetupPage;
  let transactionsPage: TransactionsPage;
  let debtsPage: DebtsPage;
  let healthPage: HealthPage;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    setupPage = new SetupPage(page);
    transactionsPage = new TransactionsPage(page);
    debtsPage = new DebtsPage(page);
    healthPage = new HealthPage(page);

    await setupPage.fullSetup();
  });

  test('Scenario 1: Healthy Status (Positive Cash Flow)', async ({ page }) => {
    await transactionsPage.createTransaction({
      type: 'income',
      amount: '50000',
      description: 'Monthly Salary'
    });

    await transactionsPage.createTransaction({
      type: 'expense',
      amount: '20000',
      description: 'Rent'
    });

    // Wait for UI to reflect balance
    await expect.poll(async () => await transactionsPage.getTotalBalance()).toBe(30000);

    await healthPage.navigateToHealth();

    // The status label in FinancialHealth.tsx for healthy state is "Healthy / ஆரோக்கியம்"
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('Healthy');
    
    const netFlow = await healthPage.getNetFlow();
    expect(netFlow).toBe(30000);

    const netWorth = await healthPage.getNetWorth();
    expect(netWorth).toBe(30000);
  });

  test('Scenario 2: Critical Status (Significant Negative Cash Flow)', async ({ page }) => {
    await transactionsPage.createTransaction({
      type: 'income',
      amount: '1000',
      description: 'Side Gig'
    });

    await transactionsPage.createTransaction({
      type: 'expense',
      amount: '5000',
      description: 'Big Purchase'
    });

    await expect.poll(async () => await transactionsPage.getTotalBalance()).toBe(-4000);

    await healthPage.navigateToHealth();

    // Status label: "Critical / நெருக்கடி"
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('Critical');
  });

  test('Scenario 3: Critical Status (High Debt Ratio > 50%)', async ({ page }) => {
    await transactionsPage.createTransaction({
      type: 'income',
      amount: '1000',
      description: 'Initial Cash'
    });

    await expect.poll(async () => await transactionsPage.getTotalBalance()).toBe(1000);

    await healthPage.navigateTo('Debts');
    await debtsPage.createDebt({
      type: 'Owed',
      amount: '600',
      person: 'Bank',
      description: 'Loan',
      createTransaction: false
    });

    // Verify debt is in the list to ensure DB update
    await expect(page.locator('text=Bank')).toBeVisible();

    await healthPage.navigateToHealth();

    // Status label: "High Risk / அதிக அபாயம்"
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('High Risk');
    const ratio = await healthPage.getDebtRatio();
    expect(ratio).toBeGreaterThan(50);
  });

  test('Scenario 4: Warning Status (Minor Deficit with Threshold)', async ({ page }) => {
    // 1. Establish initial assets via reconciliation (Adjustment doesn't count as Income)
    await transactionsPage.createTransaction({
      type: 'reconcile',
      amount: '10000',
      wallet: 'Cash / ரொக்கம்'
    });

    // 2. Set threshold to 2000
    await healthPage.setDeficitThreshold('2000');
    
    // Give some time for settings to propagate
    await page.waitForTimeout(500);

    // 3. Create a deficit that is within the 2000 threshold (e.g., -1000)
    await transactionsPage.navigateTo('Transactions');
    await transactionsPage.createTransaction({
      type: 'income',
      amount: '1000',
      description: 'Income'
    });

    await transactionsPage.createTransaction({
      type: 'expense',
      amount: '2000',
      description: 'Expense'
    });

    await expect.poll(async () => await transactionsPage.getTotalBalance()).toBe(9000); // 10000 + 1000 - 2000

    await healthPage.navigateToHealth();

    // With 9000 assets and 1000 deficit:
    // netFlow = -1000. deficitThreshold = 2000. -1000 < -2000 is FALSE.
    // totalLiabilities = 0 (since global balance is 9000). debtToAssetRatio = 0.
    // hits "Minor Deficit" (netFlow < 0).
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('Minor Deficit');
  });

  test('Scenario 5: Warning Status (Moderate Debt 30-50%)', async ({ page }) => {
    await transactionsPage.createTransaction({
      type: 'income',
      amount: '2000',
      description: 'Initial Cash'
    });

    await expect.poll(async () => await transactionsPage.getTotalBalance()).toBe(2000);

    await healthPage.navigateTo('Debts');
    await debtsPage.createDebt({
      type: 'Owed',
      amount: '800', // 800/2000 = 40%, and 800 > 500 threshold
      person: 'Friend',
      description: 'Small Loan',
      createTransaction: false
    });

    await expect(page.locator('text=Friend')).toBeVisible();

    await healthPage.navigateToHealth();

    // Status label: "Warning / எச்சரிக்கை"
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('Warning');
    const ratio = await healthPage.getDebtRatio();
    expect(ratio).toBeGreaterThan(30);
    expect(ratio).toBeLessThanOrEqual(50);
  });

  test('Scenario 6: Warning Status (Vulnerable - Breaking Even, No Assets)', async ({ page }) => {
    await healthPage.navigateToHealth();
    
    // Status label: "Vulnerable / பாதிப்புக்குள்ளாகும் நிலை"
    // Initial state is 0 assets, 0 flow -> Vulnerable
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('Vulnerable');
  });

  test('Edge Case: Significant Liability Threshold (< 500 ignored)', async ({ page }) => {
    // We want netWorth < 0 AND netFlow == 0 to trigger "Vulnerable" 
    // instead of "High Risk" (because liability < 500)
    
    await transactionsPage.createTransaction({
      type: 'income',
      amount: '100',
      description: 'Small Cash'
    });
    
    // Balance it out so netFlow is 0
    await transactionsPage.createTransaction({
      type: 'expense',
      amount: '100',
      description: 'Spend it'
    });

    await expect.poll(async () => await transactionsPage.getTotalBalance()).toBe(0);

    await healthPage.navigateTo('Debts');
    await debtsPage.createDebt({
      type: 'Owed',
      amount: '400',
      person: 'Friend',
      description: 'Trivial Debt',
      createTransaction: false
    });

    await expect(page.locator('text=Friend')).toBeVisible();

    await healthPage.navigateToHealth();

    // With 0 assets and 400 debt, net worth is -400.
    // Ratio is 100% (since assets are 0 and liab > 0), but liability is < 500, so it's not "High Risk".
    // netFlow is 0, netWorth is -400 -> hits "Vulnerable".
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('Vulnerable'); 
    
    const status = await healthPage.getHealthStatus();
    expect(status).not.toContain('High Risk');
    expect(status).not.toContain('Warning / எச்சரிக்கை');
  });

  test('Edge Case: Negative Cash handled as Overdraft', async ({ page }) => {
    await transactionsPage.createTransaction({
      type: 'expense',
      amount: '1500', // Exceeds default 1000 threshold
      description: 'Overspending'
    });

    await expect.poll(async () => await transactionsPage.getTotalBalance()).toBe(-1500);

    await healthPage.navigateToHealth();

    // Cash -1500 means netFlow -1500. 
    // Status label: "Critical / நெருக்கடி"
    await expect.poll(async () => await healthPage.getHealthStatus(), { timeout: 10000 }).toContain('Critical');

    const netWorth = await healthPage.getNetWorth();
    expect(netWorth).toBe(-1500);
  });
});
