// pages/CommonPage.ts
/* import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CommonPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  private clickOnSettings = '/html/body/div[2]/aside[1]/div[2]/nav/div[1]/div/span';


  async navigateToSettings() {
    await this.clickByXpath(this.clickOnSettings); 

  }

    async clickPlatformOrganizations() {
    await this.page.getByText('Platform Organizations', { exact: true }).click();
  }

  async navigateToPlatformOrganizations() {
    await this.clickByText('Platform Organizations');
  }

  async clickAddNew() {

  await this.page.waitForLoadState('networkidle');
  await this.page.locator('button:has-text("Add New")').click();

  }

async enterName(name: string) {
  await this.page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
}

async enterDisplayName(displayName: string) {
  await this.page.getByRole('textbox', { name: 'Display Name', exact: true }).fill(displayName);
}
async clickSubmit() {
  await this.page.getByRole('button', { name: 'Submit', exact: true }).click();
}

async clickById(id: string) {
    const element = this.page.locator(`#${id}`);
    await element.waitFor({ state: 'visible' });
    await element.click();
  }

 async clickByText(text: string) {
    const element = this.page.getByText(text, { exact: true });
    await element.waitFor({ state: 'visible' });
    await element.click();
  }

  async verifyTextVisible(text: string) {
    await expect(
      this.page.getByText(text, { exact: true })
    ).toBeVisible();
  }

   async clickByVisibleName(name: string) {
    const element = this.page.getByRole('button', { name: new RegExp(name, 'i') })
      .or(this.page.getByRole('link', { name: new RegExp(name, 'i') }))
      .or(this.page.getByText(name));

    await element.first().waitFor({ state: 'visible' });
    await element.first().click();
  }
  
  async FinanceMenu() {
  
     //await this.clickByXpath(this.financeMenu);
    //await this.page.locator('[data-title="Finance Menu"]').click();
   // await this.page.getByTitle('Finance Menu').click();
   await this.page.locator('button[data-title="Finance Menu"]').click();
  }
  

  async createOrganization(name: string, display: string) {
    await this.enterName(name);
    await this.enterDisplayName(display);
    await this.clickSubmit();
  }

 */

