import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { FiltersModal } from './components/FiltersModal';

export interface TransactionParams {
  type: 'income' | 'expense' | 'transfer' | 'reconcile';
  amount: string;
  description?: string;
  wallet?: string;
  fromWallet?: string;
  toWallet?: string;
}

export class TransactionsPage extends BasePage {
  private filtersModal: FiltersModal;

  constructor(page: Page) {
    super(page);
    this.filtersModal = new FiltersModal(page);
  }

  async openTransactionForm() {
    await this.page.getByLabel(/Add Expense/i).click();
    await this.page.waitForSelector('#transaction-form', { state: 'visible' });
  }

  async createTransaction(params: TransactionParams) {
    if (params.type === 'reconcile') {
      if (params.wallet) {
        await this.filtersModal.filterByWallet(params.wallet);
      }

      await this.page.getByLabel('Reconcile balance').click();
      await this.page.waitForSelector('#reconcile-form', { state: 'visible' });
      await this.page.fill('#actualBalance', params.amount);
      await this.page.getByRole('button', { name: /Confirm and Adjust/i }).click();
      await this.page.waitForSelector('#reconcile-form', { state: 'hidden' });
      
      if (params.wallet) {
        await this.filtersModal.filterByWallet('all');
      }
      return;
    }

    await this.openTransactionForm();

    if (params.type === 'income') {
      await this.page.getByRole('button', { name: 'Income', exact: true }).click();
    } else if (params.type === 'transfer') {
      await this.page.getByRole('button', { name: 'Transfer', exact: true }).click();
    }

    await this.page.fill('#amount', params.amount);
    if (params.description) {
      await this.page.fill('#description', params.description);
    }

    if (params.type === 'transfer') {
      if (params.fromWallet) await this.page.selectOption('#fromWallet', { label: params.fromWallet });
      if (params.toWallet) await this.page.selectOption('#toWallet', { label: params.toWallet });
    } else if (params.wallet) {
      await this.page.selectOption('#wallet', { label: params.wallet });
    }

    await this.page.getByRole('button', { name: /Save Transaction/i }).click();
    await this.page.waitForSelector('#transaction-form', { state: 'hidden' });
  }

  async getWalletBalance(walletName: string) {
    await this.filtersModal.filterByWallet(walletName);
    const balance = await this.getTotalBalance();
    await this.filtersModal.filterByWallet('all');
    return balance;
  }

  async verifyTransactionCount(description: string, count: number) {
    const items = this.page.locator('.transaction-item');
    const filteredItems = items.filter({ hasText: description });
    await expect(filteredItems).toHaveCount(count);
  }
}
