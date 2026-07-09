import { Given, Then, When } from '@cucumber/cucumber';
import { fixture } from "../../hooks/pageFixture";


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
     await fixture.claimsPage.clickOnClaimAction(string, 1);
});
       
