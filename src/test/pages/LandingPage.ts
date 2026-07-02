import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private loginLink = this.page.getByText('Click here to Login');

 async openApplication() {
  const baseUrl = process.env.BASEURL;

  if (!baseUrl) {
    throw new Error("BASEURL is not defined in environment file");
  }

  await this.page.goto(baseUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
}
  async clickLogin() {
    await expect(this.loginLink).toBeVisible({ timeout: 30000 });
    await Promise.all([
      this.page.waitForURL(/login|auth0|accounts\.google\.com/i, { timeout: 30000 }),
      this.loginLink.click(),
    ]);
  }
}