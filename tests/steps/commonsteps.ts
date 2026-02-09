import { When, Then } from '@cucumber/cucumber';
import { LoadingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';

let loadingPage: LoadingPage;
let loginPage: LoginPage;

When('User logs into Vapusdata Application', async function () {
  loadingPage = new LoadingPage(this.page);
  await loadingPage.openApplication();
  await loadingPage.clickLogin();

  loginPage = new LoginPage(this.page);
  await loginPage.login(process.env.VAPUS_USER!, process.env.VAPUS_PASS!);
});

Then('User should be logged in successfully', async function () {
  await loginPage.verifyLoginSuccess();
});
