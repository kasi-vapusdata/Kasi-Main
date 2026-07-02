/* import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { fixture } from "../../hooks/pageFixture";


// ================= BACKGROUND =================

Given("user opens the VapusData application", async function () {
  await fixture.page.goto(process.env.BASEURL as string);
});

When("user clicks login", async function () {
  await fixture.page.locator("text=Login").click();
});


// ================= DOMAIN CREATION =================

When("I click on Settings", async function () {
  await fixture.page.locator("text=Settings").click();
});

When("I click on Platform Organizations", async function () {
  await fixture.page.locator("text=Platform Organizations").click();
});

When("I click on Add New button", async function () {
  await fixture.page.locator("text=Add New").click();
});

When(
  'I enter domain name {string} and display name {string}',
  async function (domainName: string, displayName: string) {
    await fixture.page.locator('input[name="domainName"]').fill(domainName);
    await fixture.page.locator('input[name="displayName"]').fill(displayName);
  }
);

When("I click on Submit", async function () {
  await fixture.page.locator("text=Submit").click();
});


// ================= APPLICATION ACCESS =================

When('I click on "{string}"', async function (buttonName: string) {
  await fixture.page.locator(`text=${buttonName}`).click();
});

Then('"{string}" should be displayed', async function (text: string) {
  await expect(fixture.page.locator(`text=${text}`)).toBeVisible();
});


// ================= FINANCE NAVIGATION =================

When("I click on the Finance Menu", async function () {
  await fixture.page.locator("text=Finance").click();
});

Then('I should see "{string}"', async function (text: string) {
  await expect(fixture.page.locator(`text=${text}`)).toBeVisible();
});
 */


import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { fixture } from "../../hooks/pageFixture";


// =========================
// BACKGROUND STEPS
// =========================



// =========================
// GENERIC CLICK STEP
// =========================

// Matches:
// user clicks on Settings
// user clicks on "Applications"
// user clicks on "Bills"

/*When(/^user clicks on "?(.+?)"?$/, async function (element: string) {
  await fixture.page.locator(`text=${element}`).click();
});


When("user clicks on the Finance Menu", async function () {
  await fixture.page.locator("text=Finance").click();
});

*/

When(/^user clicks on "?(.+?)"?$/, async function (element: string) {
  
  // 1️⃣ Try visible text first
  const textLocator = fixture.page.getByText(element, { exact: true });

  if (await textLocator.count() > 0) {
    await textLocator.first().click();
    return;
  }

  // 2️⃣ Try data-title attribute (for icon buttons like Finance Menu)
  const dataTitleLocator = fixture.page.locator(`[data-title="${element}"]`);

  if (await dataTitleLocator.count() > 0) {
    await dataTitleLocator.first().click();
    return;
  }

  // 3️⃣ Try aria-label
  const ariaLocator = fixture.page.locator(`[aria-label="${element}"]`);

  if (await ariaLocator.count() > 0) {
    await ariaLocator.first().click();
    return;
  }

  throw new Error(`Element "${element}" not found on page`);
});



// =========================
// DOMAIN CREATION
// =========================

When(
  'user enters domain name {string} and display name {string}',
  async function (domainName: string, displayName: string) {
    await fixture.page.locator('input[name="domainName"]').fill(domainName);
    await fixture.page.locator('input[name="displayName"]').fill(displayName);
  }
);


// =========================
// FINANCE MENU (Specific Step)
// =========================



// =========================
// VALIDATION STEPS
// =========================

Then('"{string}" should be displayed', async function (text: string) {
  await expect(fixture.page.locator(`text=${text}`)).toBeVisible();
});

Then('user should see "{string}"', async function (text: string) {
  await expect(fixture.page.locator(`text=${text}`)).toBeVisible();
});
