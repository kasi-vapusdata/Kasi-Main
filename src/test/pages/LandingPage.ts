import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  public loginLink = this.page.getByText('Click here to Login');
  private profileIcon = this.page.locator("//aside[2]/div/div/button/p");
  private ClickOnDomainNameDropDown=this.page.locator("//aside[2]/div/div/div/div[1]/button");
  private domainSearchBox = this.page.locator("//aside[2]/div/div/div/div[1]/div/div[1]/input");
  private SelectDomainNameFromList = this.page.locator("((//*[@class='relative z-10'])[1]//div[1])[1]");

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
    await this.loginLink.click();
  }

  async clickOnProfileIcon(){
    await this.profileIcon.click();
  }

  async SelectDomainName(domainName: string) {
    await this.ClickOnDomainNameDropDown.click();
    await this.domainSearchBox.fill(domainName);
    await this.SelectDomainNameFromList.click();
  }

  // State/Validation methods (for use in test assertions)
  getLoginLinkLocator() {
    return this.loginLink;
  }
}



