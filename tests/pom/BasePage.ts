import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async clearData() {
    await this.page.evaluate(async () => {
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
    await this.page.reload();
    await this.page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async getTotalBalance() {
    const text = await this.page.locator('.text-5xl.font-bold').textContent();
    return parseFloat(text?.replace(/[^\d.-]/g, '') || '0');
  }

  async navigateTo(tab: 'Transactions' | 'Debts' | 'Investments') {
    await this.page.getByRole('button', { name: tab, exact: true }).click();
  }

  async waitForMainView() {
    await expect(this.page.locator('text=Total Balance / மொத்த இருப்பு')).toBeVisible({ timeout: 10000 });
  }
}
