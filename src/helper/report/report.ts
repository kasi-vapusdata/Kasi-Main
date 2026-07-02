const report = require("multiple-cucumber-html-reporter");
const os = require("os");

report.generate({
  jsonDir: "test-results",
  jsonFilePattern: "cucumber-report.json",  
  reportPath: "test-results/html-report",
  reportName: "VapusData Automation Report",
  pageTitle: "VapusData Test Execution Report",
  displayDuration: true,

  metadata: {
    browser: {
      name: process.env.BROWSER || "chrome",
      version: "Latest",
    },
    device: `${os.hostname()} - PC`,
    platform: {
      name: os.platform(),
      version: os.release(),
    },
  },

  customData: {
    title: "Execution Information",
    data: [
      { label: "Project", value: "VapusData Application" },
      { label: "Framework", value: "Playwright + Cucumber (TypeScript)" },
      { label: "Environment", value: process.env.ENV || "prod" },
      { label: "Executed By", value: "G Kasi Reddy" },
      { label: "Execution Time", value: new Date().toLocaleString() }
    ],
  },
});
