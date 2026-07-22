import { Given, Then, When } from '@cucumber/cucumber';
import { fixture } from "../../hooks/pageFixture";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { compareExcelFiles } from "../../helper/util/excelCompare";
import { generateRhBusinessComparisonReport } from "../../helper/util/rhBusinessReport";
import { FrameworkError } from "../../helper/claims-validation";


When("user navigates to Claims page from Finance menu", async function () {
    await fixture.claimsPage.clickOnClaimsPageFromFinanceMenu();
});

When('Select filter {string} as {string}', async function (string1, string2) {
    await fixture.claimsPage.selectFilter(string1, string2);
    fixture.claimsFilterContext.set(string1, string2);
    await fixture.logger.info(`[ClaimsValidation] Captured filter ${string1}=${string2}`);
});

Then('click on the first claim {string} in the list', async function (string) {
     const totalClaims = await fixture.claimsPage.getClaimsCount();

     await fixture.logger.info(`Total claims in table: ${totalClaims}`);
     console.log(`Total claims in table: ${totalClaims}`);

     if (totalClaims <= 0) {
        await fixture.logger.info('No claims found in table. Skipping action Click.');
        throw new Error('No claims found in the claims table.');
     }

     await fixture.logger.info(`Clicking first claim ${string} from the list`);
      const detailsPage = await fixture.claimsPage.clickOnClaimActionAndSwitchToNewPage(string, 1);
      fixture.page = detailsPage;
      fixture.claimsPage.setPage(detailsPage);
        fixture.APBillsPage.setPage(detailsPage);
      await fixture.logger.info('Switched to claim details page opened in a new tab.');
});

Then('click on download {string} and verify data', async function (fileType) {
    await verifyDownloadedFile.call(this, fileType);
});

Then('click on download RH file and verify data', async function () {
    await verifyDownloadedFile.call(this, "RH file");
});

Then('click on download Config file and verify data', async function () {
    await verifyDownloadedFile.call(this, "Config file");
});

async function verifyDownloadedFile(this: any, fileType: string) {
        const normalizedFileType = fileType.trim().toLowerCase();

        if (normalizedFileType.includes("config")) {
            const downloadedConfigFiles = await fixture.claimsPage.downloadConfigFilesFromSection();
            await fixture.logger.info(
                `[ClaimsValidation] Downloaded config files for validation: ${downloadedConfigFiles.map((item) => item.fileName).join(", ")}`
            );

            const validationResult = await fixture.claimsValidationOrchestrator.validateDownloadedConfigFiles(
                fixture.claimsFilterContext,
                downloadedConfigFiles
            );

            await this.attach(
                `Config validation summary:\nResolved folder: ${validationResult.resolvedFolder.resolvedPath}\nDownloaded files: ${downloadedConfigFiles.map((item) => item.fileName).join(", ")}\nTotal files: ${validationResult.totalFiles}\nMatched: ${validationResult.matchedFiles}\nMismatched: ${validationResult.mismatchedFiles}`,
                "text/plain"
            );

            for (const result of validationResult.comparedFiles) {
                await this.attach(result.summary, "text/plain");
                if (result.htmlReport) {
                    await this.attach(result.htmlReport, "text/html");
                }
                if (await fs.pathExists(result.actualPath)) {
                    const downloadedConfigFileBuffer = await fs.readFile(result.actualPath);
                    await this.attach(downloadedConfigFileBuffer, "text/csv");
                }
                if (!result.isEqual) {
                    throw new Error(
                        `Config validation failed for ${path.basename(result.actualPath)}. ${result.detail || result.summary}`
                    );
                }
            }

            await fixture.logger.info("Downloaded config files were validated successfully.");
            return;
        }

        if (normalizedFileType.includes("rh")) {
            try {
                const validationResult = await fixture.claimsValidationOrchestrator.validateRhFiles(
                    fixture.claimsFilterContext
                );

                await this.attach(
                    `RH validation summary:\nResolved folder: ${validationResult.resolvedFolder.resolvedPath}\nTotal files: ${validationResult.totalFiles}\nMatched: ${validationResult.matchedFiles}\nMismatched: ${validationResult.mismatchedFiles}`,
                    "text/plain"
                );

                for (const result of validationResult.comparedFiles) {
                    await this.attach(result.summary, "text/plain");
                    if (result.htmlReport) {
                        await this.attach(result.htmlReport, "text/html");
                    }

                    if (await fs.pathExists(result.actualPath)) {
                        const downloadedFileBuffer = await fs.readFile(result.actualPath);
                        await this.attach(
                            downloadedFileBuffer,
                            "application/octet-stream"
                        );
                    }

                    if (!result.isEqual) {
                        throw new Error(
                            `RH validation failed for ${path.basename(result.actualPath)}. ${result.detail || result.summary}`
                        );
                    }
                }

                await fixture.logger.info("Dynamic RH validation completed successfully.");
                return;
            } catch (error) {
                if (!(error instanceof FrameworkError)) {
                    throw error;
                }
                await fixture.logger.warn(
                    `[ClaimsValidation] Dynamic RH validation fallback activated: ${error.message}`
                );
            }
        }

        await fixture.logger.info(`Clicking download for ${fileType}`);

        const downloadedFilePath = await fixture.claimsPage.clickOnDownloadRHFile();
        await fixture.logger.info(`Downloaded file saved at: ${downloadedFilePath}`);

        const defaultExpectedPath = "/home/kasi/KasiQA/VpAutomation/VapusAutomation/src/test/TestData/Electronics/PUC_FDC/RH_File.xlsx";
        const configuredExpectedPath = process.env.EXPECTED_RH_SHEET_PATH?.trim() || defaultExpectedPath;
        const expandedExpectedPath = configuredExpectedPath.startsWith("~/")
            ? path.join(os.homedir(), configuredExpectedPath.slice(2))
            : configuredExpectedPath;
        let resolvedExpectedPath = path.isAbsolute(expandedExpectedPath)
            ? expandedExpectedPath
            : path.resolve(expandedExpectedPath);

        if (!(await fs.pathExists(resolvedExpectedPath))) {
            const expectedDir = path.dirname(resolvedExpectedPath);
            const filesInDir = (await fs.pathExists(expectedDir)) ? await fs.readdir(expectedDir) : [];
            const variantFile = filesInDir.find((fileName) => /^rh[-_ ]?file\.xlsx$/i.test(fileName));

            if (variantFile) {
                resolvedExpectedPath = path.join(expectedDir, variantFile);
                await fixture.logger.info(`Using fallback expected sheet: ${resolvedExpectedPath}`);
            } else {
                throw new Error(
                    `Expected sheet not found at ${resolvedExpectedPath}. Set EXPECTED_RH_SHEET_PATH in your env file if your expected sheet is in a different location.`
                );
            }
        }

        const captureComparisonEvidence = async (type: "failure" | "error", reason: string) => {
            const evidenceName = `comparison-${type}-${Date.now()}`;
            const evidencePath = `test-results/screenshots/${evidenceName}.png`;
            const evidenceScreenshot = await fixture.page.screenshot({
                path: evidencePath,
                type: "png",
                fullPage: true,
            });

            await this.attach(evidenceScreenshot, "image/png");
            await this.attach(
                `Comparison ${type} for sheet RH_Data. Expected: ${resolvedExpectedPath} | Downloaded: ${downloadedFilePath} | Screenshot: ${evidencePath} | Reason: ${reason}`,
                "text/plain"
            );
        };

        let comparisonResult;
        try {
            comparisonResult = compareExcelFiles(resolvedExpectedPath, downloadedFilePath, "RH_Data");
        } catch (error) {
            const compareErrorMessage = (error as Error).message;
            await captureComparisonEvidence("error", compareErrorMessage);
            throw error;
        }

        await this.attach(comparisonResult.textSummary, "text/plain");
        const rhBusinessReport = generateRhBusinessComparisonReport(
            resolvedExpectedPath,
            downloadedFilePath,
            "RH_Data"
        );
        await this.attach(rhBusinessReport.htmlReport, "text/html");

        if (await fs.pathExists(downloadedFilePath)) {
            const downloadedRhFileBuffer = await fs.readFile(downloadedFilePath);
            await this.attach(
                downloadedRhFileBuffer,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
        }

        if (!comparisonResult.isEqual) {
            await captureComparisonEvidence("failure", comparisonResult.reason || "Unknown mismatch");
            throw new Error(
                `Downloaded sheet does not match expected sheet. ${comparisonResult.reason}`
            );
        }

        await fixture.logger.info("Downloaded RH sheet matches expected sheet for worksheet RH_Data.");
}
