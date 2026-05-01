import { test, expect } from '@playwright/test';
import { SetupPage } from './pom/SetupPage';
import { TransactionsPage } from './pom/TransactionsPage';
import { BulkAddModal } from './pom/BulkAddModal';

test.describe('Bulk Add E2E', () => {
  let setupPage: SetupPage;
  let transactionsPage: TransactionsPage;
  let bulkAddModal: BulkAddModal;

  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    setupPage = new SetupPage(page);
    transactionsPage = new TransactionsPage(page);
    bulkAddModal = new BulkAddModal(page);

    await setupPage.fullSetup();
  });

  test('Empty Input: Review is disabled', async ({ page }) => {
    await bulkAddModal.open();
    const reviewBtn = page.getByRole('button', { name: 'Review' });
    await expect(reviewBtn).toBeDisabled();
  });

  test('Live Validation: Invalid lines are counted correctly', async ({ page }) => {
    await bulkAddModal.open();
    await bulkAddModal.enterRawText('Invalid Line\nCoffee 150\nAnother invalid');
    const validCount = await bulkAddModal.getValidCountText();
    expect(validCount).toContain('1 / 3 valid');
  });

  test('Default Overrides: Changing default wallet reflects in review', async ({ page }) => {
    await bulkAddModal.open();
    await bulkAddModal.setDefaultWallet('Bank / வங்கி');
    await bulkAddModal.enterRawText('Tea 20');
    await bulkAddModal.clickReview();
    
    // Check if the select for wallet in the review view has "Bank / வங்கி" selected
    const walletSelect = page.locator('select').nth(1); // 0th is default wallet, wait no, default wallet is not visible in review
    // Let's just check the value of the first select that contains the wallets
    const reviewWalletSelect = page.locator('.grid select').first();
    await expect(reviewWalletSelect).toHaveValue('Bank / வங்கி');
  });

  test('Invalid to Valid flow and Cancel Flow', async ({ page }) => {
    await bulkAddModal.open();
    await bulkAddModal.enterRawText('Error line');
    await bulkAddModal.clickReview();
    
    // Should show error in review view
    await expect(page.locator('text=Could not find a valid amount')).toBeVisible();
    
    // Go back to edit
    await bulkAddModal.clickBackToEdit();
    await bulkAddModal.enterRawText('Error line 100');
    await bulkAddModal.clickReview();
    
    // Now it should be valid, no error message
    await expect(page.locator('text=Could not find a valid amount')).toBeHidden();
    const amountInput = page.locator('input[type="number"]').first();
    await expect(amountInput).toHaveValue('100');

    // Cancel Flow
    await page.getByRole('button', { name: /Back to Edit/i }).click(); // go back to input view to cancel, or actually there is no cancel in review
    // Wait, cancel button is in the input view
    await bulkAddModal.close();

    // Reopen and verify it's cleared
    await bulkAddModal.open();
    const textarea = page.locator('textarea[placeholder^="Coffee"]');
    await expect(textarea).toHaveValue('');
  });

  test('Ledger Balance and Bulk Edit', async ({ page }) => {
    // Initial balance should be 0
    let balance = await transactionsPage.getTotalBalance();
    expect(balance).toBe(0);

    await bulkAddModal.open();
    // Add 3 expenses of 100 each
    await bulkAddModal.enterRawText('Coffee 100\nTea 100\nSnacks 100');
    await bulkAddModal.clickReview();

    // Bulk Edit: change the 3rd amount from 100 to 50
    await bulkAddModal.setReviewItemAmount(2, '50');
    await bulkAddModal.clickSaveAll();

    // Wait for saving to complete (modal hides)
    await page.waitForSelector('text=Bulk Add Transactions', { state: 'hidden' });

    // The total balance should now be -250 (since they are expenses and default to cash)
    // Wait for the balance to update and settle using polling
    await expect(async () => {
      balance = await transactionsPage.getTotalBalance();
      expect(balance).toBe(-250);
    }).toPass({ timeout: 15000 });
  });
});
