import { Given, When, Then } from "@cucumber/cucumber";
import { expect ,Page} from "@playwright/test";
import { fixture } from "../../hooks/pageFixture";
import { APBillsPage } from "../pages/ApBilsPage";
import { LandingPage } from "../pages/LandingPage";

When(/^user clicks on "?(.+?)"?$/, async function (element: string) {

  const currentPage: Page = fixture.page;

  const candidates = [
    currentPage.getByRole("button", { name: element }),
    currentPage.getByRole("link", { name: element }),
    currentPage.getByRole("menuitem", { name: element }),
    currentPage.getByText(element, { exact: true }),
    currentPage.locator(`[data-title="${element}"]`),
    currentPage.locator(`[aria-label="${element}"]`),
    currentPage.locator(`text=${element}`),
  ];

  let elementHandle: ReturnType<Page["locator"]> | null = null;

  for (const candidate of candidates) {
    const first = candidate.first();
    try {
      await first.waitFor({ state: "visible", timeout: 3000 });
      elementHandle = first;
      break;
    } catch {
      // Try the next locator strategy.
    }
  }

  if (!elementHandle) {
    throw new Error(`Element '${element}' not found or not visible in 20 seconds.`);
  }

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
       