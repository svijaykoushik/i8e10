import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface DebtParams {
  type: 'Lent' | 'Owed';
  amount: string;
  person: string;
  description?: string;
  createTransaction?: boolean;
  wallet?: string;
}

export class DebtsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openDebtForm() {
    await this.page.getByLabel(/Add Debt/i).click();
    await this.page.waitForSelector('#debt-form', { state: 'visible' });
  }

  async createDebt(params: DebtParams) {
    await this.openDebtForm();
    
    if (params.type === 'Owed') {
      await this.page.getByRole('button', { name: /Owed \/ வாங்கியது/i }).click();
    }
    
    await this.page.fill('#amount', params.amount);
    await this.page.fill('#person', params.person);
    if (params.description) {
      await this.page.fill('#description', params.description);
    }
    
    if (params.createTransaction) {
      await this.page.locator('label[for="create-transaction"]').click();
      if (params.wallet) {
        await this.page.selectOption('#wallet', { label: params.wallet });
      }
    }
    
    await this.page.getByRole('button', { name: /Save Record/i }).click();
    await this.page.waitForSelector('#debt-form', { state: 'hidden' });
  }

  async editDebt(person: string, newAmount: string) {
    const debtMenu = this.page.locator('li').filter({ hasText: person }).locator('button[aria-haspopup="true"]');
    await debtMenu.click();
    await this.page.getByRole('menuitem', { name: 'Edit' }).click();
    
    await this.page.waitForSelector('#debt-form', { state: 'visible' });
    await this.page.fill('#amount', newAmount);
    await this.page.getByRole('button', { name: /Save Changes/i }).click();
    await this.page.waitForSelector('#debt-form', { state: 'hidden' });
  }

  async addInstallment(person: string, params: { amount: string, note?: string, wallet?: string, createSurplus?: boolean }) {
    const debtMenu = this.page.locator('li').filter({ hasText: person }).locator('button[aria-haspopup="true"]');
    await debtMenu.click();
    await this.page.getByRole('menuitem', { name: 'Add Installment' }).click();
    
    await this.page.waitForSelector('#installment-form', { state: 'visible' });
    await this.page.fill('#inst-amount', params.amount);
    if (params.note) {
      await this.page.fill('#inst-note', params.note);
    }
    
    if (params.wallet) {
      await this.page.selectOption('#wallet-inst', { label: params.wallet });
    }

    if (params.createSurplus) {
      await this.page.locator('label[for="create-surplus"]').click();
    }
    
    await this.page.getByRole('button', { name: /Save Installment/i }).click();
    await this.page.waitForSelector('#installment-form', { state: 'hidden' });
  }

  async forgiveDebt(person: string) {
    const debtMenu = this.page.locator('li').filter({ hasText: person }).locator('button[aria-haspopup="true"]');
    await debtMenu.click();
    await this.page.getByRole('menuitem', { name: 'Forgive debt' }).click();
    await this.page.getByRole('button', { name: 'Confirm' }).click();
    await this.page.waitForTimeout(500);
  }

  async deleteDebt(person: string) {
    const debtMenu = this.page.locator('li').filter({ hasText: person }).locator('button[aria-haspopup="true"]');
    await debtMenu.click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }

  async toggleExpand(person: string) {
    await this.page.locator(`text=Lent to ${person}`).first().click();
  }
}
