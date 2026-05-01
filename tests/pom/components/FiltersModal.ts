import { Page } from '@playwright/test';

export class FiltersModal {
  constructor(private page: Page) {}

  async open() {
    await this.page.getByLabel('Open filters').click();
    await this.page.waitForSelector('#filter-modal', { state: 'visible' });
  }

  async selectWallet(walletName: string | 'all') {
    if (walletName === 'all') {
        await this.page.selectOption('#filter-wallet', 'all');
    } else {
        await this.page.selectOption('#filter-wallet', { label: walletName });
    }
  }

  async apply() {
    await this.page.getByRole('button', { name: /Apply Filters/i }).click();
    await this.page.waitForSelector('#filter-modal', { state: 'hidden' });
    // AnimatedNumber delay
    await this.page.waitForTimeout(1000);
  }

  async filterByWallet(walletName: string | 'all') {
    await this.open();
    await this.selectWallet(walletName);
    await this.apply();
  }
}
