import { test, expect } from '@playwright/test';
import { SetupPage } from './pom/SetupPage';

test.describe('Reports UI E2E Tests', () => {
  let setupPage: SetupPage;

  test.beforeEach(async ({ page }) => {
    setupPage = new SetupPage(page);
    await setupPage.fullSetup();
  });

  test('can open overflow menu and report modal', async ({ page }) => {
    // 1. Open the overflow menu in the header
    const overflowButton = page.getByRole('button', { name: /open menu/i });
    await expect(overflowButton).toBeVisible();
    await overflowButton.click();

    // 2. Click "Reports" in the dropdown
    const reportsMenuItem = page.getByRole('menuitem', { name: /reports/i });
    await expect(reportsMenuItem).toBeVisible();
    await reportsMenuItem.click();

    // 3. Verify Report Modal is open
    const reportModalTitle = page.getByRole('heading', { name: /Income Statement/i });
    await expect(reportModalTitle).toBeVisible();

    // 4. Select a period
    const periodSelect = page.getByLabel(/Time Period/i);
    await periodSelect.selectOption('ytd');

    // 5. Generate PDF button exists
    const generateBtn = page.getByRole('button', { name: /Generate PDF/i });
    await expect(generateBtn).toBeVisible();
  });
});
