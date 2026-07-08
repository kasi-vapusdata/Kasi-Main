import { Locator, Page, expect } from '@playwright/test';

export type RoleType =
  | 'button'
  | 'link'
  | 'textbox'
  | 'heading'
  | 'combobox'
  | 'checkbox'
  | 'radio'
  | 'main'
  | 'dialog';

export class BasePage {
  constructor(protected page: Page) {}

  setPage(page: Page) {
    this.page = page;
  }

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

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `./test-results/screenshots/${name}.png` });
  }

  async smartClick(name: string, container?: Locator) {
    const scope = container ?? this.page;
    const candidates = [
      scope.getByRole('button', { name }),
      scope.getByRole('link', { name }),
      scope.getByText(name, { exact: true }),
      scope.locator(`[data-title="${name}"]`),
    ];

    for (const locator of candidates) {
      try {
        await locator.first().waitFor({ state: 'visible', timeout: 2000 });
        await locator.first().scrollIntoViewIfNeeded();
        await locator.first().click();
        return;
      } catch {
        // try next locator
      }
    }

    throw new Error(`Element '${name}' not found or not clickable.`);
  }

  async performAction(
    action: 'click' | 'fill' | 'check' | 'uncheck',
    role: RoleType,
    name: string,
    value?: string
  ) {
    const locator = this.page.getByRole(role as any, { name });
    await locator.waitFor({ state: 'visible' });

    switch (action) {
      case 'click':
        await locator.click();
        break;
      case 'fill':
        if (!value) throw new Error('Value required for fill action');
        await locator.fill(value);
        break;
      case 'check':
        await locator.check();
        break;
      case 'uncheck':
        await locator.uncheck();
        break;
    }
  }

  async clickAndSwitchToPopup(role: RoleType, name: string): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.performAction('click', role, name);
    const newPage = await popupPromise;
    await newPage.waitForLoadState('load');
    return newPage;
  }

  async uploadFile(selector: string, filePath: string) {
    await this.page.locator(selector).setInputFiles(filePath);
  }

  extractNumber(text: string | null): number {
    return Number(text?.match(/\d+/)?.[0] ?? 0);
  }
}
