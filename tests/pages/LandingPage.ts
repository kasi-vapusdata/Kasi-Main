import { Page, expect } from '@playwright/test';

export class LoadingPage {
  constructor(private page: Page) {}

  private loginLink = this.page.locator(
    'a[href="/login/redirect"]'
  );

  async openApplication() {
    await this.page.goto('https://dev.vapusdata.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  }

  async clickLogin() {
    await expect(this.loginLink).toBeVisible({ timeout: 30000 });
    await Promise.all([
      this.page.waitForURL(/login|auth0/i, { timeout: 30000 }),
      this.loginLink.click(),
    ]);
  }
}
