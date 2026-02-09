import { Given, When, Then } from '@cucumber/cucumber';
import { LoadingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';

let loadingPage: LoadingPage;
let loginPage: LoginPage;

/* -------- GIVEN -------- */

Given('user opens the VapusData application', async function () {
  loadingPage = new LoadingPage(this.page);
  loginPage = new LoginPage(this.page);
  await loadingPage.openApplication();
});

Given('user clicks login', async function () {
  await loadingPage.clickLogin();
});

/* -------- WHEN -------- */

When('user enters username {string}', async function (username: string) {
  if (username && username.trim()) {
    await loginPage.enterUsername(username);
  }
});

When('user enters password {string}', async function (password: string) {
  if (password && password.trim()) {
    await loginPage.enterPassword(password);
  }
});

When('user clicks login button', async function () {
  await loginPage.clickLogin();
});

/* -------- THEN -------- */

Then('{string} should be displayed', async function (outcome: string) {
  switch (outcome) {
    case 'Finance Command Center':
      await loginPage.verifyLoginSuccess();
      break;

    case 'login error message':
      await loginPage.verifyLoginError();
      break;

    case 'validation messages':
      await loginPage.verifyValidationMessages();
      break;

    case 'Wrong password':
      await loginPage.verifyValidationMessages();
      break;

    default:
      throw new Error(`Unknown outcome: ${outcome}`);
  }
});
When('user clicks on Continue with Google button', async function () {
  await loginPage.continueWithGoogle();
});

/*Then('Then user should be redirected to Sign in page', async function () {
  await loginPage.verifyGoogleAuthPage();
});*/


When('user enter email or phone {string}', async function (email: string) {
  await loginPage.enterGoogleEmail(email);
  
});

When('user clicks on next button', async function () {
  await loginPage.clickGoogleNext();
});
When('user enter signin password {string}', async function (password: string) {
  await loginPage.enterGooglepassword(password);
});
Then('{string} should be display', async function (message: string) {
  await loginPage.verifyMessageContains(message);
});

