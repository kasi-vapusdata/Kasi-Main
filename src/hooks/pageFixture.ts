import { Page } from "@playwright/test";
import { Logger } from "winston";
import type { APBillsPage } from "../test/pages/ApBilsPage";
import type { ClaimsPage } from "../test/pages/ClaimsPage.spec";

interface Fixture {
  page: Page;
  logger: Logger;
  APBillsPage: APBillsPage;
  claimsPage: ClaimsPage;
}

export const fixture = {} as Fixture;