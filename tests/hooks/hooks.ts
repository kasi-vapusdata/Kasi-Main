
import { Before, After } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { setDefaultTimeout } from '@cucumber/cucumber';

setDefaultTimeout(20 * 1000); // 60 seconds

Before(async function () {
  this.browser = await chromium.launch({ headless: false });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
});

After(async function () {
  if (this.page && !this.page.isClosed()) {
    await this.page.close();
  }

  if (this.context) {
    await this.context.close();
  }

  if (this.browser) {
    await this.browser.close();
  }
});
