import { Given, When, Then } from '@cucumber/cucumber';
import { fixture } from "../../hooks/pageFixture";
import { expect } from "@playwright/test";

// ===============================
// Navigation & Page Validations
// ===============================



Then('{string} page should be displayed', async (pageName: string) => {
  //await fixture.APBillsPage.verifyPageDisplayed(pageName);
   await fixture.APBillsPage.clickElementByTextOrRole(pageName);  
});

Then('Invoice table should be visible', async () => {
  await fixture.APBillsPage.verifyInvoiceTableVisible();
});

Then('Import button should be enabled', async () => {
  await fixture.APBillsPage.verifyImportButtonEnabled();
});

Then('Search box should be enabled', async () => {
  await fixture.APBillsPage.verifySearchBoxEnabled();
});

Then('Filters button should be enabled', async () => {
  await fixture.APBillsPage.verifyFiltersButtonEnabled();
});



// ===============================
// Import Scenarios
// ===============================


When('User uploads valid {string} file', async (fileType: string) => {
  await fixture.APBillsPage.uploadFile(fileType);
});

When('user clicks on import button', async () => {
  await fixture.APBillsPage.clickImportButton();
});

When('user press on file {string} button', async (ButtonName: string) => {
  await fixture.APBillsPage.pressFileButton(ButtonName);
});

When('User clicks on {string} link', async (name: string) => {
  await fixture.APBillsPage.clickElementByTextOrRole(name);
});




// ===============================
// Success & Log Validations
// ===============================


Then('Success message {string} is displayed', async function (expectedMessage: string) {
  const successMessage = fixture.page.locator('text=' + expectedMessage);
  await expect(successMessage).toBeVisible({ timeout: 10000 });
});


When('User clicks on View Details', async () => {
  await fixture.APBillsPage.clickElementByTextOrRole('View Details');
});





Then('Process log entry created with {string}', async function (processName: string) {
  await fixture.APBillsPage.verifyProcessLogEntry(processName);
  fixture.logger.info('Process log entry is created *************** ');
});



Then('Import status should become {string}', async (status: string) => {
  await fixture.APBillsPage.verifyImportStatus(status);
});



Then('Input file count should match processed count', async () => {
  await fixture.APBillsPage.verifyInputMatchesProcessed();
});




Given('User is on {string} page', async (pageName: string) => {
  await fixture.APBillsPage.verifyPageDisplayed(pageName);
});

Then('Upload section should be visible', async () => {
	// Validate upload section is visible
});

Then('Resource dropdown should display {string}', async (resource: string) => {
	// Validate resource dropdown value
});

Then('Back button should be visible', async () => {
	// Validate Back button is visible
});

// ===============================
// Valid File Import
// ===============================



When('User uploads multiple valid {string} files', async (files: string) => {
  const fileArray = files.split(',').map(f => f.trim()).filter(f => f.length > 0);
  await fixture.APBillsPage.uploadMultipleFiles(fileArray);
});

When('User uploads a valid invoice file', async () => {
	// Upload a valid invoice file
});



When('User clicks on "Add More Files"', async () => {
  await fixture.APBillsPage.clickElementByTextOrRole('Add More Files');
});

When('User uploads another valid invoice file', async () => {
	// Upload another valid invoice file
});

// ===============================
// Invalid File Import
// ===============================

When('User uploads invalid {string} file', async (fileType: string) => {
	// Upload invalid file of given type
});

Then('Processed file count should be 0', async () => {
	// Validate processed file count is 0
});

Then('No invoice record should be created', async () => {
	// Validate no invoice record exists
});


When('User selects resource {string}', async function (value: string) {
  await fixture.APBillsPage.selectResourceToImport(value);

});

When('User uploads invoice file', async () => {
	// Upload invoice file
});

When('User uploads invoice file larger than {string}', async (size: string) => {
	// Upload file larger than specified size
});

Then('Proper validation message should be displayed', async () => {
	// Validate file size error message
});

// ===============================
// Import Logs
// ===============================

Given('Import process is completed', async () => {
	// Ensure import process is completed
});

When('User navigates to {string} page', async (pageName: string) => {
	// Navigate to page
});

Then('Import ID and status should be displayed', async () => {
	// Validate import ID and status
});

Then('Import Logs details should be displayed', async () => {
	 await fixture.APBillsPage.printDebugTextsFromXpaths();
});

Then('"Logs" displayed', async (name:string) => {
     await fixture.APBillsPage.clickElementByTextOrRole(name);
 });

When('User clicks on "View AP Vendor Bills"', async () => {
    await fixture.APBillsPage.clickElementByTextOrRole('View AP Vendor Bills');
});

Then('User should be navigated to Bills page', async () => {
	// Validate navigation to Bills page
});

Then('Imported invoice record should be visible', async () => {
	// Validate imported invoice record
});



When('User clicks on "Items" button', async () => {
  await fixture.APBillsPage.clickElementByTextOrRole('Items');
});

// ===============================
// Back Button
// ===============================



When('User clicks on "Back" button', async () => {
  await fixture.APBillsPage.clickElementByTextOrRole('Back');
});

Then('User should be navigated to {string} page', async (pageName: string) => {
	// Validate navigation to page
});

// ===============================
// View & Edit Invoice
// ===============================

Given('Invoice record exists', async () => {
	// Ensure invoice record exists
});

Then('Invoice details page should be displayed', async () => {
	// Validate invoice details page
});

Then('Invoice preview should be visible', async () => {
	// Validate invoice preview
});

Then('Download button should be enabled', async () => {
	// Validate Download button is enabled
});

Then('Edit button should be enabled', async () => {
	// Validate Edit button is enabled
});



When('User clicks on "Edit" button', async () => {
  await fixture.APBillsPage.clickElementByTextOrRole('Edit');
});

Then('Edit Invoice page should be displayed', async () => {
	// Validate Edit Invoice page
});

Then('Editable invoice fields should be visible', async () => {
	// Validate editable invoice fields
});

Then('{string} button should be enabled', async (buttonName: string) => {
	
});
