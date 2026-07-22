const fs = require('fs');
const os = require('os');
const path = require('path');
const report = require('multiple-cucumber-html-reporter');
const cucumberHtmlReporter = require('cucumber-html-reporter');
const {
  createReportMetadata,
  createScenarioRow,
  renderScenarioIndex,
} = require('./scenarioIndexRenderer');

function generateHtmlReport() {
  const jsonDir = path.resolve('reports');
  const jsonFileName = 'cucumber.json';
  const jsonFilePath = path.join(jsonDir, jsonFileName);

  if (!fs.existsSync(jsonFilePath)) {
    console.warn(`Cucumber JSON not found at ${jsonFilePath}. Skipping HTML report generation.`);
    return;
  }

  report.generate({
    jsonDir,
    jsonFilePattern: jsonFileName,
    reportPath: path.resolve('reports/html-report'),
    reportName: 'VapusData Automation Report',
    pageTitle: 'VapusData Test Execution Report',
    displayDuration: true,
    metadata: {
      browser: {
        name: process.env.BROWSER || 'firefox',
        version: 'latest',
      },
      device: `${os.hostname()} - PC`,
      platform: {
        name: process.platform,
        version: os.release(),
      },
    },
    customData: {
      title: 'Basic Details',
      data: [
        { label: 'Client Name', value: process.env.CLIENT_NAME || 'Flipkart' },
        { label: 'Employee Name', value: process.env.EMPLOYEE_NAME || 'Kasi' },
        { label: 'Environment', value: process.env.ENV || 'Sandbox' },
        { label: 'Execution Time', value: new Date().toLocaleString() },
      ],
    },
  });

  console.log('HTML report generated at reports/html-report/index.html');
}

function sanitizeName(value) {
  return String(value || 'scenario')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function generateScenarioHtmlReports() {
  const jsonFilePath = path.resolve('reports/cucumber.json');
  if (!fs.existsSync(jsonFilePath)) {
    return;
  }

  const raw = fs.readFileSync(jsonFilePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed) || !parsed.length) {
    return;
  }

  const jsonOutDir = path.resolve('reports/scenario-json');
  const htmlOutDir = path.resolve('reports/scenario-html');
  fs.mkdirSync(jsonOutDir, { recursive: true });
  fs.mkdirSync(htmlOutDir, { recursive: true });

  const scenarioRows = [];
  let serial = 1;

  for (const feature of parsed) {
    const scenarios = Array.isArray(feature.elements) ? feature.elements : [];

    for (const scenario of scenarios) {
      const scenarioTitle = scenario.name || `Scenario ${serial}`;
      const featureTitle = feature.name || 'Feature';
      const safeBase = `${String(serial).padStart(3, '0')}-${sanitizeName(featureTitle)}-${sanitizeName(scenarioTitle)}`;
      const scenarioJsonPath = path.join(jsonOutDir, `${safeBase}.json`);
      const scenarioHtmlPath = path.join(htmlOutDir, `${safeBase}.html`);

      const scenarioOnlyDoc = [
        {
          ...feature,
          elements: [scenario],
        },
      ];

      fs.writeFileSync(scenarioJsonPath, JSON.stringify(scenarioOnlyDoc, null, 2));

      cucumberHtmlReporter.generate({
        theme: 'bootstrap',
        jsonFile: scenarioJsonPath,
        output: scenarioHtmlPath,
        reportSuiteAsScenarios: true,
        launchReport: false,
        metadata: {
          Browser: process.env.BROWSER || 'firefox',
          Platform: `${process.platform} ${os.release()}`,
          Client: process.env.CLIENT_NAME || 'Flipkart',
          Employee: process.env.EMPLOYEE_NAME || 'Kasi',
        },
      });

      scenarioRows.push(createScenarioRow(feature, scenario, `${safeBase}.html`, scenarioTitle));

      serial += 1;
    }
  }

  fs.writeFileSync(path.join(htmlOutDir, 'index.html'), renderScenarioIndex(scenarioRows, createReportMetadata()));
  console.log('Scenario-level HTML reports generated at reports/scenario-html/index.html');
}

function generateReports() {
  generateHtmlReport();
  generateScenarioHtmlReports();
}

module.exports = {
  generateHtmlReport,
  generateReports,
  generateScenarioHtmlReports,
};