import { Page } from '@playwright/test';
import { AppConfig } from '../config/config';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string = '') {
    await this.page.goto(`${AppConfig.baseUrl}${path}`, {
      waitUntil: 'load',
      timeout: 30000,
    });
  }
}
