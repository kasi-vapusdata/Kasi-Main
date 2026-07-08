/*import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';


export class LoginPage extends BasePage {
  private googlePage: Page | null = null;
  
  constructor(page: Page) {
    super(page);
  }

  // Local Login Locators
  private usernameInput = this.page.locator('#username');
  private passwordInput = this.page.locator('#password');
  private continueButton = this.page.locator('button[data-action-button-primary="true"]');
  private loginError = this.page.getByText('Wrong email or password');
  private usernameValidation = this.page.getByText('Please enter an email address');
  
  // Google Login Locators
  private continueWithGoogleButton = this.page.locator('button[data-provider="google"]');
  
  // Google Auth Page Locators (will be used with googlePage)
  private get googleEmailInput() {
    return this.googlePage?.locator('#identifierId');
  }
  
  private get googleNextButton() {
    return this.googlePage?.getByRole('button', { name: 'Next' });
  }
  
  private get googlePasswordInput() {
    return this.googlePage?.locator('input[name="Passwd"]');
  }
  
  private get googleErrorMessage() {
    return this.googlePage?.locator('[role="alert"]');
  }

  // Local Login Methods
  async enterUsername(username: string) {
    if (username) {
      await expect(this.usernameInput).toBeVisible({ timeout: 30000 });
      await this.usernameInput.fill(username);
    }
  }

  async enterPassword(password: string) {
    if (password) {
      await expect(this.passwordInput).toBeVisible({ timeout: 30000 });
      await this.passwordInput.fill(password);
    }
  }

  async clickLogin() {
    await expect(this.continueButton).toBeVisible({ timeout: 30000 });
    await this.continueButton.click();
  }

  async verifyLoginSuccess() {
    // Wait for navigation away from login pages
    await this.page.waitForURL(/^(?!.*(auth0|login|accounts\.google)).*$/, { 
      timeout: 30000 
    });
  }

  async verifyLoginError() {
    await expect(this.loginError).toBeVisible({ timeout: 30000 });
  }

  async verifyValidationMessages() {
    await expect(this.usernameValidation).toBeVisible({ timeout: 30000 });
  }

  // Google Login Methods
  async continueWithGoogle() {
    await expect(this.continueWithGoogleButton).toBeVisible({ timeout: 30000 });
    
    // Handle popup window
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.continueWithGoogleButton.click()
    ]);
    
    await popup.waitForLoadState();
    this.googlePage = popup;
    console.log('Google auth page opened');
  }

  async enterGoogleEmail(email: string) {
    if (!this.googlePage) {
      throw new Error('Google page not initialized. Call continueWithGoogle first.');
    }
    
    const emailInput = this.googlePage.locator('#identifierId');
    await expect(emailInput).toBeVisible({ timeout: 30000 });
    await emailInput.click();
    await emailInput.fill(email);
  }

  async clickGoogleNext() {
    if (!this.googlePage) {
      throw new Error('Google page not initialized. Call continueWithGoogle first.');
    }
    
    const nextButton = this.googlePage.getByRole('button', { name: 'Next' });
    await expect(nextButton).toBeEnabled({ timeout: 30000 });
    await nextButton.click();
    
    // Wait for either password field or error message
    await this.googlePage.waitForTimeout(2000);
  }

  async enterGooglePassword(password: string) {
    if (!this.googlePage) {
      throw new Error('Google page not initialized. Call continueWithGoogle first.');
    }
    
    const passwordField = this.googlePage.locator('input[name="Passwd"]');
    await expect(passwordField).toBeVisible({ timeout: 30000 });
    await passwordField.click();
    await passwordField.fill(password);
  }

  async verifyGoogleErrorMessage(expectedMessage: string) {
    if (this.googlePage && !this.googlePage.isClosed()) {
      // Check for error on Google page
      const errorLocator = this.googlePage.locator('[role="alert"]');
      await expect(errorLocator).toBeVisible({ timeout: 30000 });
      const errorText = await errorLocator.textContent();
      
      if (expectedMessage === 'Wrong password') {
        expect(errorText).toContain('Wrong password');
      } else if (expectedMessage === 'Enter an email or phone number') {
        expect(errorText).toContain('Enter an email');
      }
    } else {
      // Check on main page
      const locator = this.page.getByText(expectedMessage);
      await expect(locator).toBeVisible({ timeout: 30000 });
    }
  }
}*/






import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private googlePage: Page | null = null;

  constructor(page: Page) {
    super(page);
  }

  // Local Login Locators
  private usernameInput = this.page.locator('#username');
  private passwordInput = this.page.locator('#password');
  private continueButton = this.page.locator('button[data-action-button-primary="true"]');
  private loginError = this.page.getByText('Wrong email or password');
  private usernameValidation = this.page.getByText('Please enter an email address');

  // Google Login Locators
  private continueWithGoogleButton = this.page.locator('button[data-provider="google"]');

  // Google Auth Page Locators (will be used with googlePage)
  private get googleEmailInput() {
    return this.googlePage?.locator('#identifierId');
  }

  private get googleNextButton() {
    return this.googlePage?.getByRole('button', { name: 'Next' });
  }

  private get googlePasswordInput() {
    return this.googlePage?.locator('input[name="Passwd"]');
  }

  private get googleErrorMessage() {
    return this.googlePage?.locator('[role="alert"]');
  }

  // Local Login Methods
  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLoginButton() {
    await this.continueButton.click();
    
  }

  async clickContinueWithGoogle() {
    await this.continueWithGoogleButton.click();
  }

  setGooglePage(page: Page) {
    this.googlePage = page;
  }

  // Google Auth Methods
  async fillGoogleEmail(email: string) {
    await this.googleEmailInput?.fill(email);
  }

  async clickGoogleNext() {
    await this.googleNextButton?.click();
  }

  async fillGooglePassword(password: string) {
    await this.googlePasswordInput?.fill(password);
  }

  // State/Validation methods (for use in test assertions)
  getLoginErrorLocator() {
    return this.loginError;
  }

  getUsernameValidationLocator() {
    return this.usernameValidation;
  }

  getGoogleErrorMessageLocator() {
    return this.googleErrorMessage;
  }
  async loginWithEnvCredentials() {
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  if (!username || !password) {
    throw new Error("USERNAME or PASSWORD not defined in .env file");
  }

  await this.fillUsername(username);
  await this.fillPassword(password);
  await this.clickLoginButton();
}

async googleLoginWithEnvCredentials() {
  const email = process.env.GOOGLE_USERNAME;
  const password = process.env.GOOGLE_PASSWORD;

  if (!email || !password) {
    throw new Error("GOOGLE_USERNAME or GOOGLE_PASSWORD not defined in .env");
  }

  await this.fillGoogleEmail(email);
  await this.clickGoogleNext();
  await this.fillGooglePassword(password);
  await this.clickGoogleNext();
}
}



