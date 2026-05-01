import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface InvestmentParams {
  name: string;
  type: string;
  initialAmount: string;
  createTransaction?: boolean;
  wallet?: string;
}

export class InvestmentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openInvestmentForm() {
    await this.page.getByLabel(/Add Investment/i).click();
    await this.page.waitForSelector('#investment-form', { state: 'visible' });
  }

  async createInvestment(params: InvestmentParams) {
    await this.openInvestmentForm();
    await this.page.fill('#inv-name', params.name);
    await this.page.fill('#inv-type', params.type);
    await this.page.fill('#inv-initial', params.initialAmount);
    
    if (params.createTransaction === false) {
      await this.page.locator('label[for="create-transaction-investment"]').click();
    } else if (params.wallet) {
      await this.page.selectOption('#wallet-investment', { label: params.wallet });
    }
    
    await this.page.getByRole('button', { name: /Save Investment/i }).click();
    await this.page.waitForSelector('#investment-form', { state: 'hidden' });
  }

  async updateValue(name: string, newValue: string) {
    const menu = this.page.locator('li').filter({ hasText: name }).locator('button[aria-haspopup="true"]');
    await menu.click();
    await this.page.getByRole('menuitem', { name: 'Update Value' }).click();
    
    await this.page.waitForSelector('#update-investment-form', { state: 'visible' });
    await this.page.fill('#currentValue', newValue);
    await this.page.getByRole('button', { name: /Update Value/i }).click();
    await this.page.waitForSelector('#update-investment-form', { state: 'hidden' });
  }

  async editInvestment(name: string, newName: string) {
    const menu = this.page.locator('li').filter({ hasText: name }).locator('button[aria-haspopup="true"]');
    await menu.click();
    await this.page.getByRole('menuitem', { name: 'Edit' }).click();
    await this.page.fill('#inv-name', newName);
    await this.page.getByRole('button', { name: /Save Changes/i }).click();
  }

  async addTransaction(name: string, params: { type: 'Contribution' | 'Withdrawal' | 'Dividend', amount: string, wallet?: string, createTransaction?: boolean }) {
    const menu = this.page.locator('li').filter({ hasText: name }).locator('button[aria-haspopup="true"]');
    await menu.click();
    await this.page.getByRole('menuitem', { name: 'Add Transaction' }).click();
    
    await this.page.waitForSelector('#investment-tx-form', { state: 'visible' });
    
    if (params.type !== 'Contribution') {
      await this.page.getByRole('button', { name: params.type, exact: true }).click();
    }
    
    await this.page.fill('#inv-tx-amount', params.amount);
    
    if (params.createTransaction === false) {
      await this.page.locator('label[for="create-transaction-investment"]').click();
    } else if (params.wallet) {
      await this.page.selectOption('#wallet-investment-tx', { label: params.wallet });
    }
    
    await this.page.getByRole('button', { name: /Save Transaction/i }).click();
  }

  async sellInvestment(name: string, wallet: string) {
    const menu = this.page.locator('li').filter({ hasText: name }).locator('button[aria-haspopup="true"]');
    await menu.click();
    await this.page.getByRole('menuitem', { name: 'Sell Investment' }).click();
    await this.page.waitForSelector('text=Confirm Sale of Investment');
    await this.page.selectOption('#wallet-sell', { label: wallet });
    await this.page.getByRole('button', { name: /Yes, Confirm Sale/i }).click();
  }

  async deleteInvestment(name: string) {
    const menu = this.page.locator('li').filter({ hasText: name }).locator('button[aria-haspopup="true"]');
    await menu.click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }
}
