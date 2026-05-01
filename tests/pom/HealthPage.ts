import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HealthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToHealth() {
    await this.navigateTo('Health');
  }

  async getHealthStatus() {
    return await this.page.locator('h4.text-xl.font-bold').textContent();
  }

  async getHealthMessage() {
    return await this.page.locator('p.text-sm.font-medium').textContent();
  }

  async getNetWorth() {
    const text = await this.page.locator('p.text-3xl.lg\\:text-4xl.font-bold').textContent();
    return parseFloat(text?.replace(/[^\d.-]/g, '') || '0');
  }

  async getDebtRatio() {
    // The ratio is displayed inside a text-xs div after "Ratio:"
    const text = await this.page.locator('div.text-xs:has-text("Ratio:")').textContent();
    const match = text?.match(/Ratio:\s*(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  async getNetFlow() {
    const text = await this.page.locator('text=Net Flow').locator('..').locator('span.font-bold').textContent();
    return parseFloat(text?.replace(/[^\d.-]/g, '') || '0');
  }

  async openSettings() {
    await this.page.getByLabel('Open settings').click();
    // Wait for the Settings modal title
    await expect(this.page.getByText(/Settings \/ அமைப்புகள்/i)).toBeVisible({ timeout: 10000 });
  }

  async setDeficitThreshold(value: string) {
    await this.openSettings();
    await this.page.fill('#deficit-threshold', value);
    await this.page.getByRole('button', { name: /Save Settings/i }).click();
    // Wait for modal to disappear
    await expect(this.page.getByText(/Settings \/ அமைப்புகள்/i)).toBeHidden({ timeout: 10000 });
  }
}
