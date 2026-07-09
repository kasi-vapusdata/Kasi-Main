import { BasePage } from "./BasePage";
export class ClaimsPage extends BasePage {


  private claimsPageLink = this.page.locator("//*/div/div[2]/div[2]/div[2]/div[2]/div[2]/div[2]/div[2]/div/a[3]/div[2]/span");

  
  async clickOnClaimsPageFromFinanceMenu() {
    await this.claimsPageLink.click();
  }

  async clickOnPage(pageName: string) {
    await this.clickByText(pageName);
  }

  async selectFilter(filterName: string, filterValue: string) {
    const normalizedFilterName = filterName.replace(/\s+/g, "");
    const filterContainer = this.page.locator(
      `//*[contains(concat(" ", normalize-space(@class), " "), " grid ") and contains(concat(" ", normalize-space(@class), " "), " grid-cols-2 ") and contains(concat(" ", normalize-space(@class), " "), " gap-4 ")]//label[translate(normalize-space(), " ", "")="${normalizedFilterName}"]//following-sibling::div[1]`
    ).first();

    await filterContainer.waitFor({ state: "visible" });
    await filterContainer.scrollIntoViewIfNeeded();
    await filterContainer.click();

    const inputSelector = 'input[placeholder*="Search"], input[aria-label*="Search"], input[role="combobox"], input[type="text"], input';
    const localSearchInput = filterContainer.locator(inputSelector).first();
    const localInputVisible = await localSearchInput.isVisible().catch(() => false);
    const searchInput = localInputVisible
      ? localSearchInput
      : this.page.locator(inputSelector).last();

    await searchInput.click();
    await searchInput.fill(filterValue);

    const escapedFilterValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const option = this.page.getByText(new RegExp(`^\\s*${escapedFilterValue}\\s*$`, "i")).first();

    if (await option.isVisible().catch(() => false)) {
      await option.click();
    } else {
      await searchInput.press("Enter");
    }

    const selectedButton = filterContainer.getByRole("button", { name: /selected/i }).first();
    if (await selectedButton.isVisible().catch(() => false)) {
      await selectedButton.click();
    }
  }

  async getClaimsCount() {
    return await this.page.locator('(//tbody)//tr').count();
  }

  async clickOnClaimAction(actionName: string, index: number) {
    const normalizedActionName = actionName.toLowerCase();
    const claimAction = this.page.locator(
      `(//*[@data-title and translate(normalize-space(@data-title), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="${normalizedActionName}"])[${index}]`
    );
    await claimAction.click();
  }

  async clickOnClaimViewDetails(index: number) {
    await this.clickOnClaimAction("View Details", index);
  }

  async clickOnFirstClaimViewDetails() {
    await this.clickOnClaimViewDetails(1);
  }
}
