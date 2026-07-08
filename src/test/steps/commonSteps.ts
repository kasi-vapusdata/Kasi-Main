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


/*

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

----

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

*/


import { Given, When, Then } from "@cucumber/cucumber";
import { expect ,Page} from "@playwright/test";
import { fixture } from "../../hooks/pageFixture";
import { APBillsPage } from "../pages/ApBilsPage";
import { LandingPage } from "../pages/LandingPage";



/* When(/^user clicks on "?(.+?)"?$/, async function (element: string) {
  
  // 1️⃣ Try visible text first
  const textLocator = fixture.page.getByText(element, { exact: true });

  if (await textLocator.count() > 0) {
    await textLocator.first().click();
    await fixture.page.waitForTimeout(1000);
    return;
  }

  // 2️⃣ Try data-title attribute (for icon buttons like Finance Menu)
  const dataTitleLocator = fixture.page.locator(`[data-title="${element}"]`);

  if (await dataTitleLocator.count() > 0) {
    await dataTitleLocator.first().click();
    await fixture.page.waitForTimeout(3000);
    return;
  }

  // 3️⃣ Try aria-label
  const ariaLocator = fixture.page.locator(`[aria-label="${element}"]`);

  if (await ariaLocator.count() > 0) {
    await ariaLocator.first().click();
    await fixture.page.waitForTimeout(1000);
    return;
  }

  throw new Error(`Element "${element}" not found on page`);
}); */



When(/^user clicks on "?(.+?)"?$/, async function (element: string) {

  const currentPage: Page = fixture.page;

  const locator =
    currentPage.getByRole("button", { name: element })
      .or(currentPage.getByRole("link", { name: element }))
      .or(currentPage.getByRole("menuitem", { name: element }))
      .or(currentPage.getByText(element, { exact: true }))
      .or(currentPage.locator(`[data-title="${element}"]`))
      .or(currentPage.locator(`[aria-label="${element}"]`))
      .or(currentPage.locator(`text=${element}`));

  const elementHandle = locator.first();

  await elementHandle.waitFor({ state: "visible", timeout: 20000 });
  await elementHandle.scrollIntoViewIfNeeded();

  const context = currentPage.context();

  // Prepare listeners (non-blocking)
  const pageEvent = context.waitForEvent("page").catch(() => null);
  const popupEvent = currentPage.waitForEvent("popup").catch(() => null);

  await elementHandle.click();
  
  await currentPage.waitForLoadState("domcontentloaded");

  // Wait briefly to see if new page/popup opened
  const targetPage = await Promise.race([
    pageEvent,
    popupEvent,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
  ]) as Page | null;

  if (targetPage) {
    await targetPage.waitForLoadState("domcontentloaded");

    fixture.page = targetPage;

    // Reinitialize page objects
    fixture.APBillsPage = new APBillsPage(fixture.page);

    // Debug: Log the title and URL of the new window
    const pageTitle = await targetPage.title();
    const pageUrl = targetPage.url();
    console.log(`Switched to new window: Title='${pageTitle}', URL='${pageUrl}'`);
  } else {
    // If same page navigation happened
    await currentPage.waitForLoadState("domcontentloaded");
  }
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

       
Then('user click on Profile Icon', async function () {
  const landingPage = new LandingPage(fixture.page);
  await landingPage.clickOnProfileIcon();
});
            
 Then('Enter the domain name in the search box {string}', async function (domainName: string) {
  const landingPage = new LandingPage(fixture.page);
  await landingPage.SelectDomainName(domainName);
 
});
       