import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import path from "path";

export class APBillsPage extends BasePage {

  // =========================
  // Locators
  // =========================

  private importButton = this.page.getByRole("button", { name: "Import" });
  private searchBox = this.page.getByPlaceholder("Search...");
  private filtersButton = this.page.getByRole("button", { name: "Filters" });
  private invoiceTable = this.page.locator("#ap-bills-list-table_wrapper");

  private resourceDropdown = this.page.getByRole("button", {
    name: "Select a resource to import",
  });

  private resourceSearchInput = this.page.getByRole("textbox", {
    name: "Search resources...",
  });

  private resourcePanel = this.page.locator("#eligible-resource-dropdown");

  private getFirstRow = () => this.page.locator("tbody tr").first();
  private getInputCell = () => this.getFirstRow().locator("td").nth(4);
  private getProcessedCell = () => this.getFirstRow().locator("td").nth(5);
  private getStatusCell = () => this.getFirstRow().locator("td").nth(6);

  // =========================
  // Navigation
  // =========================

  async navigateToBillsPage() {
    await this.smartClick("Applications");
    const newPage = await this.clickAndSwitchToPopup("button", "Go To App");
    this.setPage(newPage);

    await this.smartClick("Finance Menu");
    await this.smartClick("AP");
    await this.smartClick("Bills");

    await this.waitForNetworkIdle();
  }

  // =========================
  // Validations
  // =========================

  async verifyPageDisplayed(title: string) {
    await this.verifyTextVisible(title);
  }

  async verifyInvoiceTableVisible() {
    await expect(this.invoiceTable).toBeVisible();
  }

  async verifyImportButtonEnabled() {
    await expect(this.importButton).toBeEnabled();
  }

  async verifySearchBoxEnabled() {
    await expect(this.searchBox).toBeEnabled();
  }

  async verifyFiltersButtonEnabled() {
    await expect(this.filtersButton).toBeEnabled();
  }

  async verifyImportStatus(status: string) {
    await expect(this.getStatusCell()).toHaveText(status);
  }

  async verifyInputMatchesProcessed() {
    const inputText = await this.getInputCell().textContent();
    const processedText = await this.getProcessedCell().textContent();

    const input = this.extractNumber(inputText);
    const processed = this.extractNumber(processedText);

    expect(input).toBeGreaterThan(0);
    expect(input).toBe(processed);
  }

  // =========================
  // File Upload
  // =========================

  async uploadMultipleFiles(fileNames: string[]) {
    const basePath = process.env.TESTDATAFILESPATH;

    if (!basePath) {
      throw new Error(
        "TESTDATAFILESPATH is not defined in environment variables."
      );
    }

    const filePaths = fileNames.map((file) =>
      path.resolve(basePath, file.trim())
    );

    await this.page
      .locator('input[type="file"]')
      .setInputFiles(filePaths);

    await this.verifyTextVisible("Uploaded successfully");
  }

  // =========================
  // Resource Selection
  // =========================

  async selectResource(value: string) {
    await this.resourceDropdown.click();
    await this.resourceSearchInput.fill(value);

    const option = this.resourcePanel
      .locator("div.cursor-pointer", { hasText: value })
      .first();

    await option.waitFor({ state: "visible" });
    await option.click();
  }
  // =========================
  // Step Definitions Support (added methods)
  // =========================

  async clickElementByTextOrRole(name: string) {
    // Try to click by role first, fallback to text
    try {
      await this.page.getByRole('button', { name }).click({ timeout: 2000 });
    } catch {
      await this.page.locator(`text=${name}`).click();
    }
  }

  async uploadFile(selectorOrType: string, filePath?: string) {
    // If only one arg, treat as fileType and use default selector
    if (!filePath) {
      const basePath = process.env.TESTDATAFILESPATH;
      if (!basePath) throw new Error('TESTDATAFILESPATH is not defined.');
      const resolvedPath = require('path').resolve(basePath, selectorOrType.trim());
      await super.uploadFile('input[type="file"]', resolvedPath);
    } else {
      await super.uploadFile(selectorOrType, filePath);
    }
  }

  async clickImportButton() {
    await this.importButton.click();
  }

  async pressFileButton(ButtonName: string) {
    await this.page.getByRole('button', { name: ButtonName }).click();
  }

  async verifyProcessLogEntry(processName: string) {
    // Example: check for process log entry by text
    await expect(this.page.locator(`text=${processName}`)).toBeVisible();
  }

  async selectResourceToImport(value: string) {
    await this.selectResource(value);
  }

  async printDebugTextsFromXpaths() {
    // Example: print debug info for all xpaths (stub)
    const elements = await this.page.locator('xpath=//*').elementHandles();
    for (const el of elements) {
      const txt = await el.textContent();
      console.debug('Debug XPath Text:', txt);
    }
  }
}




