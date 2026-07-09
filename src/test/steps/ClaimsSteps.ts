import { Given, Then, When } from '@cucumber/cucumber';
import { fixture } from "../../hooks/pageFixture";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { compareExcelFiles } from "../../helper/util/excelCompare";


When("user navigates to Claims page from Finance menu", async function () {
    await fixture.claimsPage.clickOnClaimsPageFromFinanceMenu();
});

When('Select filter {string} as {string}', async function (string1, string2) {
    await fixture.claimsPage.selectFilter(string1, string2);
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
        await fixture.logger.info(`Clicking download for ${fileType}`);

        const downloadedFilePath = await fixture.claimsPage.clickOnDownloadRHFile();
        await fixture.logger.info(`Downloaded file saved at: ${downloadedFilePath}`);

        const defaultExpectedPath = "/home/kasi/KasiQA/VpAutomation/VapusAutomation/src/test/TestData/RH_File.xlsx";
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

        const comparisonResult = compareExcelFiles(resolvedExpectedPath, downloadedFilePath, "RH_Data");
        if (!comparisonResult.isEqual) {
            throw new Error(
                `Downloaded sheet does not match expected sheet. ${comparisonResult.reason}`
            );
        }

        await fixture.logger.info("Downloaded RH sheet matches expected sheet for worksheet RH_Data.");
});
