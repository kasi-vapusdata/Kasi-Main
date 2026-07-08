import { Page } from "@playwright/test";
import { Logger } from "winston";
import type { APBillsPage } from "../test/pages/ApBilsPage";

interface Fixture {
  page: Page;
  logger: Logger;
  APBillsPage: APBillsPage;
}

export const fixture = {} as Fixture;