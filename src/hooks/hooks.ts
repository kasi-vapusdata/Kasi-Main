import { BeforeAll, AfterAll, Before, After, BeforeStep, AfterStep, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { Browser, BrowserContext } from "@playwright/test";
import { fixture } from "./pageFixture";
import { invokeBrowser } from "../helper/browsers/browserManager";
import { getEnv } from "../helper/env/env";
import { createLogger } from "winston";
import { options } from "../helper/util/logger";
import fs from "fs-extra";
import { APBillsPage } from "../test/pages/ApBilsPage";
import { ClaimsPage } from "../test/pages/ClaimsPage.spec";

setDefaultTimeout(60 * 1000);
let browser: Browser;
let context: BrowserContext;

BeforeAll(async function () {
  getEnv();
  browser = await invokeBrowser();
});

BeforeStep(async function ({ pickleStep }) {
  await fixture.logger.info(`STEP START: ${pickleStep.text}`);
});

AfterStep(async function ({ pickleStep, result }) {
  const status = result?.status ?? "UNKNOWN";
  await fixture.logger.info(`STEP END: ${pickleStep.text} - ${status}`);
});

// 🔹 Non-auth scenarios
Before({ tags: "not @auth" }, async function ({ pickle }) {

  const scenarioName = `${pickle.name}-${pickle.id}`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  context = await browser.newContext({
    viewport: null,   
    recordVideo: {
      dir: "test-results/videos",
    },
  });

  await context.tracing.start({
    name: scenarioName,
    title: pickle.name,
    screenshots: true,
    snapshots: true,
    sources: true,
  });

  const page = await context.newPage();
  fixture.page = page;
  fixture.logger = createLogger(options(scenarioName));
  fixture.APBillsPage = new APBillsPage(page);
  fixture.claimsPage = new ClaimsPage(page);
});

// 🔹 Auth scenarios
Before({ tags: "@auth" }, async function ({ pickle }) {

  const scenarioName = `${pickle.name}-${pickle.id}`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  context = await browser.newContext({
    viewport: null,   
    storageState: getStorageState(pickle.name),
    recordVideo: {
      dir: "test-results/videos",
    },
  });

  await context.tracing.start({
    name: scenarioName,
    title: pickle.name,
    screenshots: true,
    snapshots: true,
    sources: true,
  });

  const page = await context.newPage();
  fixture.page = page;
  fixture.logger = createLogger(options(scenarioName));
  fixture.APBillsPage = new APBillsPage(page);
  fixture.claimsPage = new ClaimsPage(page);
});

// 🔹 After Hook
After(async function ({ pickle, result }) {

  const scenarioName = `${pickle.name}-${pickle.id}`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const tracePath = `test-results/trace/${scenarioName}.zip`;
  const logPath = `test-results/logs/${scenarioName}/log.log`;

  await context.tracing.stop({ path: tracePath });

  // Take screenshot always (or change to FAILED if you prefer)
  const screenshot = await fixture.page.screenshot({
    path: `test-results/screenshots/${scenarioName}.png`,
    type: "png",
  });

  const video = fixture.page.video();

  await fixture.page.close();
  await context.close();

  // Attach only on FAILED (recommended practice)
  if (result?.status === Status.FAILED) {

    await this.attach(screenshot, "image/png");

    if (video) {
      const videoPath = await video.path();
      const videoBuffer = fs.readFileSync(videoPath);
      await this.attach(videoBuffer, "video/webm");
    }

    const traceFileLink = `<a href="https://trace.playwright.dev/">Open Trace</a>`;
    await this.attach(`Trace file: ${traceFileLink}`, "text/html");

    fixture.logger.error("Scenario Failed");
  } else {
    fixture.logger.info("Scenario Passed");
  }

  // Ensure log transport flushes and attach scenario logs to report.
  for (const transport of fixture.logger.transports) {
    if (typeof transport.close === "function") {
      transport.close();
    }
  }

  if (fs.existsSync(logPath)) {
    const logContent = fs.readFileSync(logPath, "utf-8");
    await this.attach(logContent, "text/plain");
  }
});

AfterAll(async function () {
  await browser.close();
});

// 🔹 Storage State Helper
function getStorageState(user: string): string {

  if (user.endsWith("admin")) {
    return "src/helper/auth/admin.json";
  }

  if (user.endsWith("lead")) {
    return "src/helper/auth/lead.json";
  }

  // default
  return "src/helper/auth/default.json";
}
