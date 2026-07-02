import { Page } from "@playwright/test";
import { Logger } from "winston";

interface Fixture {
  page: Page;
  logger: Logger;
}

export const fixture = {} as Fixture;