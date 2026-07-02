import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async waitForElement(selector: string, timeout = 30000) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async clickByText(text: string, exact = true) {
    await this.page.getByText(text, { exact }).click();
  }

  async fillByLabel(label: string, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  async verifyTextVisible(text: string, timeout = 30000) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout });
  }

  async clickByLocator(locator: string) {
    await this.page.locator(locator).click();
  }

  async waitForTimeout(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `./test-results/screenshots/${name}.png` });
  }
}