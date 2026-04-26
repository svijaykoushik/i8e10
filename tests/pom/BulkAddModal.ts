import { Page, expect } from '@playwright/test';

export class BulkAddModal {
  constructor(private page: Page) {}

  async open() {
    await this.page.getByLabel('Open settings').click();
    await this.page.getByRole('button', { name: /Bulk Add/i }).click();
    await this.page.waitForSelector('text=Bulk Add Transactions', { state: 'visible' });
  }

  async close() {
    await this.page.getByRole('button', { name: /Cancel/i }).click();
    await this.page.waitForSelector('text=Bulk Add Transactions', { state: 'hidden' });
  }

  async enterRawText(text: string) {
    // The textarea has a placeholder starting with "Coffee 150"
    const textarea = this.page.locator('textarea[placeholder^="Coffee"]');
    await textarea.fill(text);
  }

  async setDefaultWallet(walletName: string) {
    await this.page.getByLabel(/Default Wallet/i).selectOption({ label: walletName });
  }

  async clickReview() {
    await this.page.getByRole('button', { name: 'Review' }).click();
    await this.page.waitForSelector('text=Review and edit the parsed transactions below', { state: 'visible' });
  }

  async clickSaveAll() {
    await this.page.getByRole('button', { name: 'Save All' }).click();
    await this.page.waitForSelector('text=Bulk Add Transactions', { state: 'hidden' });
  }

  async clickBackToEdit() {
    await this.page.getByRole('button', { name: /Back to Edit/i }).click();
    await this.page.waitForSelector('text=Enter transactions one per line', { state: 'visible' });
  }

  async getValidCountText() {
    return this.page.locator('.text-sm.font-medium.text-slate-600', { hasText: /valid/ }).textContent();
  }

  async getReviewItemAmount(index: number) {
    const amountInputs = this.page.locator('input[type="number"]');
    return amountInputs.nth(index).inputValue();
  }

  async setReviewItemAmount(index: number, amount: string) {
    const amountInputs = this.page.locator('input[type="number"]');
    await amountInputs.nth(index).fill(amount);
  }

  async getReviewItemWallet(index: number) {
    // The wallet dropdown in review is a select element
    const selects = this.page.locator('select').filter({ hasText: /Cash|Bank/ });
    // Assuming the common wallet select in review view is the n-th select (which is inside the mapped items)
    return selects.nth(index).inputValue();
  }
}
