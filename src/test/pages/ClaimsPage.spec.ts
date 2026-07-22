import { BasePage } from "./BasePage";
import { Download, Page } from "@playwright/test";
import fs from "fs-extra";
import path from "path";
import type { DownloadedFileInfo } from "../../helper/claims-validation";
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

  async clickOnClaimActionAndSwitchToNewPage(actionName: string, index: number): Promise<Page> {
    const normalizedActionName = actionName.toLowerCase();
    const claimAction = this.page.locator(
      `(//*[@data-title and translate(normalize-space(@data-title), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="${normalizedActionName}"])[${index}]`
    );

    const popupPromise = this.page.waitForEvent("popup", { timeout: 15000 }).catch(() => null);
    const contextPagePromise = this.page.context().waitForEvent("page", { timeout: 15000 }).catch(() => null);

    await claimAction.click();

    const newPage = (await popupPromise) ?? (await contextPagePromise);
    if (!newPage) {
      throw new Error("Claim details page did not open in a new tab/window.");
    }

    await newPage.waitForLoadState("domcontentloaded");
    await newPage.bringToFront();
    return newPage;
  }

  async clickOnClaimViewDetails(index: number) {
    await this.clickOnClaimAction("View Details", index);
  }

  async clickOnFirstClaimViewDetails() {
    await this.clickOnClaimViewDetails(1);
  }

  async getDownloadableFileNamesFromUi(): Promise<string[]> {
    const selector = process.env.CLAIMS_DOWNLOADABLE_FILE_NAME_SELECTOR || "a, button, td, span, div";
    const texts = await this.page.locator(selector).allInnerTexts();
    const fileNames = new Set<string>();

    const fileNameRegex = /([A-Za-z0-9_. -]+\.(?:csv|xlsx|xls|json|xml|pdf|zip|txt))/gi;

    for (const text of texts) {
      const matches = text.match(fileNameRegex);
      if (!matches) {
        continue;
      }

      for (const rawMatch of matches) {
        const cleanName = rawMatch.trim();
        if (cleanName) {
          fileNames.add(cleanName);
        }
      }
    }

    return [...fileNames];
  }

  async getConfigFileNamesFromUi(): Promise<string[]> {
    const allDownloadableFiles = await this.getDownloadableFileNamesFromUi();
    return allDownloadableFiles.filter((name) => !/\brh\b/i.test(name));
  }

  async downloadConfigFilesFromSection(): Promise<DownloadedFileInfo[]> {
    await this.waitForDownloadSectionReadiness();

    const configDownloadButtons = this.page.locator('xpath=(//section[5])//button');
    const totalConfigButtons = await configDownloadButtons.count();
    const downloadedFiles: DownloadedFileInfo[] = [];

    for (let index = 0; index < totalConfigButtons; index += 1) {
      const configDownloadButton = configDownloadButtons.nth(index);
      if (!(await configDownloadButton.isVisible().catch(() => false))) {
        continue;
      }

      const downloadedFile = await this.captureDownloadInfo(async () => {
        await configDownloadButton.click();
      });

      downloadedFiles.push(downloadedFile);
    }

    if (!downloadedFiles.length) {
      throw new Error('No config files were downloaded from locator (//section[5])//button.');
    }

    return downloadedFiles;
  }

  async downloadFileByName(fileName: string): Promise<string> {
    await this.waitForDownloadSectionReadiness();

    const fileLabel = this.page.getByText(new RegExp(`^\\s*${this.escapeRegExp(fileName)}\\s*$`, "i")).first();
    await fileLabel.waitFor({ state: "visible", timeout: 10000 });

    const rowContainer = fileLabel.locator("xpath=ancestor::*[self::tr or self::li or self::div][1]");
    const contextualDownloadButton = rowContainer
      .locator('[data-title*="download" i], button:has-text("Download"), [aria-label*="download" i]')
      .first();

    if (await contextualDownloadButton.isVisible().catch(() => false)) {
      try {
        return await this.captureDownload(async () => {
          await contextualDownloadButton.click();
        });
      } catch {
        // Fallback to additional candidate buttons when first visible control does not trigger a download.
      }
    }

    const immediateSiblingDownloadButton = fileLabel
      .locator('xpath=following::*[contains(@data-title, "Download") or contains(@aria-label, "Download") or self::button][1]')
      .first();
    if (await immediateSiblingDownloadButton.isVisible().catch(() => false)) {
      try {
        return await this.captureDownload(async () => {
          await immediateSiblingDownloadButton.click();
        });
      } catch {
        // Continue to broader fallback selectors.
      }
    }

    const fallbackDownloadButtons = this.page.locator('[data-title*="download" i], button:has-text("Download"), [aria-label*="download" i]');
    const totalButtons = await fallbackDownloadButtons.count();

    for (let index = 0; index < totalButtons; index += 1) {
      const candidate = fallbackDownloadButtons.nth(index);
      if (await candidate.isVisible().catch(() => false)) {
        try {
          return await this.captureDownload(async () => {
            await candidate.click();
          });
        } catch {
          // Keep iterating until one button produces a download event.
        }
      }
    }

    throw new Error(`Download action did not produce a file for '${fileName}'.`);
  }

  async clickOnDownloadRHFile(): Promise<string> {
    await this.waitForDownloadSectionReadiness();

    const primaryRhDownloadButton = this.page.locator('xpath=(//*[@data-title="Download file"])[2]');
    if (await primaryRhDownloadButton.isVisible().catch(() => false)) {
      try {
        return await this.captureDownload(async () => {
          await primaryRhDownloadButton.click();
        });
      } catch {
        // Continue to existing fallback chain.
      }
    }

    const configuredSelector = process.env.CLAIMS_RH_DOWNLOAD_BUTTON_SELECTOR?.trim();
    if (configuredSelector) {
      const configuredButton = this.page.locator(configuredSelector).first();
      if (await configuredButton.isVisible().catch(() => false)) {
        try {
          return await this.captureDownload(async () => {
            await configuredButton.click();
          });
        } catch {
          // Continue to smart fallback chain.
        }
      }
    }

    const rhScopedDownloadButton = this.page
      .locator('xpath=//*[contains(translate(normalize-space(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "rh")]/ancestor::*[self::tr or self::div][1]//*[contains(@data-title, "Download") or contains(@aria-label, "Download") or self::button]')
      .first();

    if (await rhScopedDownloadButton.isVisible().catch(() => false)) {
      try {
        return await this.captureDownload(async () => {
          await rhScopedDownloadButton.click();
        });
      } catch {
        // Continue to generic download controls.
      }
    }

    const fallbackDownloadButtons = this.page.locator('[data-title*="download" i], button:has-text("Download"), [aria-label*="download" i]');
    const totalFallbackButtons = await fallbackDownloadButtons.count();
    for (let index = 0; index < totalFallbackButtons; index += 1) {
      const fallbackDownloadButton = fallbackDownloadButtons.nth(index);
      if (await fallbackDownloadButton.isVisible().catch(() => false)) {
        try {
          return await this.captureDownload(async () => {
            await fallbackDownloadButton.click();
          });
        } catch {
          // Try next fallback button.
        }
      }
    }

    throw new Error("RH download action did not produce a file on claim details page.");
  }

  private async captureDownload(clickAction: () => Promise<void>): Promise<string> {
    const downloadedFile = await this.captureDownloadInfo(clickAction);
    return downloadedFile.filePath;
  }

  private async captureDownloadInfo(clickAction: () => Promise<void>): Promise<DownloadedFileInfo> {
    const pageDownloadPromise: Promise<Download | null> = this.page
      .waitForEvent("download", { timeout: 10000 })
      .catch(() => null);

    await clickAction();
    const pageDownload = await pageDownloadPromise;
    const download = pageDownload;

    if (!download) {
      throw new Error("No download event was captured after clicking the download control.");
    }

    const downloadsDir = path.resolve("test-results/downloads");
    await fs.ensureDir(downloadsDir);

    const suggestedFileName = download.suggestedFilename();
    const downloadedFilePath = path.join(downloadsDir, `${Date.now()}-${suggestedFileName}`);
    await download.saveAs(downloadedFilePath);
    return {
      fileName: suggestedFileName,
      filePath: downloadedFilePath,
    };
  }

  private async waitForDownloadSectionReadiness(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);

    const readinessCandidates = [
      '[data-title*="download" i]',
      'button:has-text("Download")',
      '[aria-label*="download" i]',
      'text=/\\.(csv|xlsx|xls|json|xml|pdf|zip|txt)\\b/i',
    ];

    for (let attempt = 0; attempt < 4; attempt += 1) {
      for (const selector of readinessCandidates) {
        const candidate = this.page.locator(selector).first();
        if (await candidate.isVisible().catch(() => false)) {
          return;
        }
      }

      await this.page.waitForTimeout(1500);
    }
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
