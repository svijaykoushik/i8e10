import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SetupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async setupPassword(password: string = 'StrongPassword123!') {
    const understandBtn = this.page.getByRole('button', { name: /I Understand, Continue/i });
    await understandBtn.waitFor({ state: 'visible', timeout: 15000 });
    await understandBtn.click();

    await this.page.fill('#new-password', password);
    await this.page.fill('#confirm-password', password);
    const setPasswordBtn = this.page.getByRole('button', { name: /Set Password & Secure Data/i });
    await expect(setPasswordBtn).toBeEnabled({ timeout: 5000 });
    await setPasswordBtn.click();
  }

  async completeRecoveryFlow() {
    await this.page.getByLabel(/I have written down my recovery phrase/i).check();
    const finishSetupBtn = this.page.getByRole('button', { name: /Finish Setup/i });
    await expect(finishSetupBtn).toBeEnabled({ timeout: 5000 });
    await finishSetupBtn.click();
  }

  async skipOnboarding() {
    const skipButton = this.page.getByRole('button', { name: /Skip/i });
    const mainViewMarker = this.page.locator('text=Total Balance / மொத்த இருப்பு');
    
    try {
      await Promise.race([
        skipButton.waitFor({ state: 'visible', timeout: 10000 }),
        mainViewMarker.waitFor({ state: 'visible', timeout: 10000 })
      ]);
      
      if (await skipButton.isVisible()) {
        await skipButton.click();
      }
    } catch (e) {
      // Continue anyway
    }
  }

  async fullSetup(password: string = 'StrongPassword123!') {
    await this.goto();
    await this.clearData();
    await this.setupPassword(password);
    await this.completeRecoveryFlow();
    // Wait for migration and initial state to settle
    await this.page.waitForTimeout(2000);
    await this.skipOnboarding();
    await this.waitForMainView();
  }
}
