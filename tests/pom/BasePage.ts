import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async clearData() {
    await this.page.evaluate(async () => {
      localStorage.clear();
      
      // Try to use the app's db delete (truncate) if available
      if ((window as any).db && typeof (window as any).db.delete === 'function') {
        try {
          await (window as any).db.delete();
        } catch (e) {
          console.error("Error calling db.delete():", e);
        }
      }

      // Instead of deleting the whole DB (which can be blocked), just clear sessionStorage too
      sessionStorage.clear();
    });
    
    await this.page.reload();
    await this.page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  async getTotalBalance() {
    const locator = this.page.locator('.text-5xl.font-bold').first();
    await expect(locator).toBeVisible({ timeout: 10000 });
    const text = await locator.textContent();
    return parseFloat(text?.replace(/[^\d.-]/g, '') || '0');
  }

  async navigateTo(tab: 'Transactions' | 'Debts' | 'Investments' | 'Health') {
    await this.page.getByRole('button', { name: new RegExp(tab, 'i') }).click();
  }

  async waitForMainView() {
    await expect(this.page.locator('text=Total Balance / மொத்த இருப்பு')).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByLabel(/Add (Expense|Debt|Investment|Item)/i)).toBeVisible({ timeout: 10000 });
  }
}
