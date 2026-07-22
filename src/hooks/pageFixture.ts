import { Page } from "@playwright/test";
import { Logger } from "winston";
import type { APBillsPage } from "../test/pages/ApBilsPage";
import type { ClaimsPage } from "../test/pages/ClaimsPage.spec";
import type { ClaimsFilterContext, ClaimsFileValidationOrchestrator } from "../helper/claims-validation";

interface Fixture {
  page: Page;
  logger: Logger;
  APBillsPage: APBillsPage;
  claimsPage: ClaimsPage;
  claimsFilterContext: ClaimsFilterContext;
  claimsValidationOrchestrator: ClaimsFileValidationOrchestrator;
}

export const fixture = {} as Fixture;