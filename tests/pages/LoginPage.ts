import { Page, expect } from '@playwright/test';

export class LoginPage {
    private googlePage!: Page; 
  constructor(private page: Page) {}

  private usernameInput = this.page.locator('#username');
  private passwordInput = this.page.locator('#password');
  private continueButton = this.page.locator('button[data-action-button-primary="true"]' );
  private loginError = this.page.getByText('Wrong email or password');
  private usernameValidation = this.page.getByText('Please enter an email address');
  private continueWithGoogleButton = this.page.locator('button[data-provider="google"]');
  private googleEmailInput = this.page.locator('#identifierId');
  private googleNextButton = this.page.getByRole('button', { name: 'Next' });
  private googlePassword=this.page.locator('input[name="Passwd"][type="password"]');


  async enterUsername(username: string) {
    await expect(this.usernameInput).toBeVisible({ timeout: 30000 });
    await this.usernameInput.fill(username);
  }

  async enterPassword(password: string) {
    await expect(this.passwordInput).toBeVisible({ timeout: 30000 });
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await expect(this.continueButton).toBeVisible({ timeout: 30000 });
    await this.continueButton.click();
  }

  async verifyLoginSuccess() {
    await expect(this.page).not.toHaveURL(/auth0|login/i);
  }

  async verifyLoginError() {
    await expect(this.loginError).toBeVisible();
  }

  async verifyValidationMessages() {
    await expect(this.usernameValidation).toBeVisible();
  }

  async login(username: string, password: string) {
    if (username) await this.enterUsername(username);
    if (password) await this.enterPassword(password);
    await this.clickLogin();
  }

  async continueWithGoogle(){
    await expect(this.continueWithGoogleButton).toBeVisible({ timeout: 30000 });
    await this.continueWithGoogleButton.click();
  }
  async verifyGoogleAuthPage() {
    await expect(this.page).toHaveURL(/accounts\.google\.com/);
    await expect(
      this.page.getByText('Choose an account')
    ).toBeVisible({ timeout: 30000 });
  }

   async verifyApplicationsPage() {
    await expect(this.page).toHaveURL(/applications|dashboard|app/i);
  }

async enterGoogleEmail(email: string) {
  await expect(this.googleEmailInput).toBeVisible({ timeout: 30000 });
  await this.googleEmailInput.click();
  await this.googleEmailInput.fill(email);
}

async clickGoogleNext() {
  await expect(this.googleNextButton).toBeEnabled({ timeout: 30000 });
  await this.googleNextButton.click();
  await this.page.waitForTimeout(10000);
}

async enterGooglepassword(email: string) {
  await expect(this.googlePassword).toBeVisible({ timeout: 30000 });
  await this.googlePassword.click();
  await this.googlePassword.fill(email);
}

async verifyMessageContains(partialText: string) {
  const locatorOnGoogle = this.googlePage
    ? this.googlePage.getByText(partialText, { exact: false })
    : null;

  if (locatorOnGoogle) {
    await expect(locatorOnGoogle).toBeVisible({ timeout: 30000 });
    return;
  }

  const locatorOnApp = this.page.getByText(partialText, { exact: false });
  await expect(locatorOnApp).toBeVisible({ timeout: 30000 });
}


}


