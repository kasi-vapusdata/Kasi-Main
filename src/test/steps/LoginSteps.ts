import { Given, When, Then } from "@cucumber/cucumber";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { fixture } from "../../hooks/pageFixture";
import { expect } from "@playwright/test";

let landingPage: LandingPage;
let loginPage: LoginPage;

Given("user opens the VapusData application", async function () {
  landingPage = new LandingPage(fixture.page);
  loginPage = new LoginPage(fixture.page);
  await landingPage.openApplication();
});

Given("user clicks login", async function () {
  await landingPage.clickLogin();
  await fixture.page.waitForLoadState("load");
  await fixture.logger.info("Login clicked and page loaded");
});

When("user enters username {string}", async function (username: string) {
  await loginPage.fillUsername(username);
  await fixture.logger.info("Username: " + username);
});

When("user enters password {string}", async function (password: string) {
  await loginPage.fillPassword(password);
});

When("user clicks login button", async function () {
  await loginPage.clickLoginButton();
  await fixture.page.waitForTimeout(4000);
});

When("user enters email or phone", async function () {
  await loginPage.loginWithEnvCredentials();
  await fixture.logger.info("Logged in using ENV credentials");
});

When("user enters signin password", async function () {
  await loginPage.googleLoginWithEnvCredentials();
  await fixture.logger.info("Google login using ENV credentials");
});
Then("{string} should be displayed", async function (outcome: string) {
  if (outcome === "VapusFin") {
    // Example: check for a dashboard element or URL
    await expect(fixture.page).toHaveURL(/dashboard|finance/i);
  } else if (outcome === "login error message") {
    await expect(loginPage.getLoginErrorLocator()).toBeVisible();
  }
});

When("user enter username", async function () {
  const username = process.env.USERNAME;
  await fixture.page.locator('input[name="username"]').fill(username as string);
});

When("user enter password", async function () {
  const password = process.env.PASSWORD;
  await fixture.page.locator('input[name="password"]').fill(password as string);
});

When("user enter password {string}", async function (password: string) {
  await fixture.page.locator('input[name="Passwd"]').fill(password);
  await fixture.logger.info("Entered Google password");
});

When("user click login button", async function () {
  await fixture.page.locator("text=Login").click();
});

When("user select Domain {string}", async function (domain: string) {
  // Click dropdown

  await fixture.page.getByRole('button', { name: 'U' }).click();
  await fixture.page.getByRole('button', { name: 'RANGAN' }).click();

// Wait for dropdown options to appear
await fixture.page.waitForSelector(`text=${domain}`);

// Click required option
await fixture.page.getByText(domain).click();
});