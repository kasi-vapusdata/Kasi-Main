const { spawnSync } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const report = require('multiple-cucumber-html-reporter');
const cucumberHtmlReporter = require('cucumber-html-reporter');

const baseArgs = [
  'src/test/features/**/*.feature',
  '--require-module',
  'ts-node/register',
  '--require',
  'src/test/steps/**/*.ts',
  '--require',
  'src/hooks/hooks.ts',
  '--format',
  'progress',
  '--format',
  'json:reports/cucumber.json',
];

const cliArgs = process.argv.slice(2);
const hasTagsArg =
  cliArgs.includes('--tags') ||
  cliArgs.includes('-t') ||
  cliArgs.includes('--tag');

const npmTag = process.env.npm_config_tag;
if (!hasTagsArg && npmTag) {
  console.log(
    `Ignoring npm --tag=${npmTag} to keep execution global. Use explicit cucumber args (for example: npm run test -- --tags "@claim") when you want filtered execution.`
  );
}

const args = [...baseArgs, ...cliArgs];
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const result = spawnSync(cmd, ['cucumber-js', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ENV: process.env.ENV || 'prod',
  },
});

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

function getScenarioStatus(scenario) {
  const stepResults = (scenario.steps || [])
    .map((step) => step.result && step.result.status)
    .filter(Boolean);

  if (stepResults.includes('failed')) {
    return 'failed';
  }

  if (stepResults.includes('skipped') || stepResults.includes('pending') || stepResults.includes('undefined')) {
    return 'incomplete';
  }

  return 'passed';
}

function sanitizeName(value) {
  return String(value || 'scenario')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

      scenarioRows.push({
        fileName: `${safeBase}.html`,
        featureName: featureTitle,
        scenarioName: scenarioTitle,
        status: getScenarioStatus(scenario),
        steps: (scenario.steps || [])
          .filter((step) => step.keyword && !String(step.keyword).toLowerCase().includes('before') && !String(step.keyword).toLowerCase().includes('after'))
          .map((step) => ({
            stepName: `${step.keyword || ''}${step.name || ''}`.trim(),
            stepStatus: (step.result && step.result.status) || 'unknown',
          })),
      });

      serial += 1;
    }
  }

  const indexRowsHtml = scenarioRows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.featureName)}</td><td>${escapeHtml(row.scenarioName)}</td><td>${escapeHtml(row.status)}</td><td><a href="./${row.fileName}" target="_blank">Open Report</a></td></tr>`
    )
    .join('\n');

  const passedCount = scenarioRows.filter((row) => row.status === 'passed').length;
  const failedCount = scenarioRows.filter((row) => row.status === 'failed').length;
  const incompleteCount = scenarioRows.filter((row) => row.status === 'incomplete').length;
  const totalCount = scenarioRows.length || 1;
  const passedPercent = Math.round((passedCount / totalCount) * 100);

  const scenarioDetailsHtml = scenarioRows
    .map((row, index) => {
      const stepItems = row.steps.length
        ? row.steps
            .map((step) => `<li><span class="step-name">${escapeHtml(step.stepName)}</span><span class="step-status ${escapeHtml(step.stepStatus)}">${escapeHtml(step.stepStatus)}</span></li>`)
            .join('')
        : '<li><span class="step-name">No steps available</span></li>';

      return `
        <details ${index === 0 ? 'open' : ''}>
          <summary>
            <span><strong>${escapeHtml(row.scenarioName)}</strong> (${escapeHtml(row.featureName)})</span>
            <span class="scenario-status ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span>
          </summary>
          <ul class="step-list">${stepItems}</ul>
        </details>
      `;
    })
    .join('\n');

  const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Scenario Reports</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; background: #f9fafb; color: #111827; }
      .summary-cards { display: flex; gap: 12px; margin: 14px 0 18px; flex-wrap: wrap; }
      .summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
      .summary-card .count { font-size: 22px; font-weight: 700; display: block; }
      .graph-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 18px; }
      .graph-title { margin: 0 0 10px; font-size: 16px; }
      .bar-track { width: 100%; height: 22px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
      .bar-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); }
      .bar-meta { margin-top: 8px; font-size: 13px; color: #4b5563; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f3f4f6; }
      details { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; margin: 10px 0; }
      summary { list-style: none; cursor: pointer; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
      .scenario-status, .step-status { text-transform: uppercase; font-size: 11px; padding: 3px 8px; border-radius: 999px; font-weight: 700; }
      .passed { background: #dcfce7; color: #166534; }
      .failed { background: #fee2e2; color: #991b1b; }
      .incomplete, .skipped, .pending, .undefined { background: #fef3c7; color: #92400e; }
      .step-list { margin: 0; padding: 0 12px 12px 28px; }
      .step-list li { margin: 7px 0; display: flex; justify-content: space-between; gap: 10px; }
      .step-name { flex: 1; }
    </style>
  </head>
  <body>
    <h1>Scenario Level Reports</h1>
    <p>Client: ${process.env.CLIENT_NAME || 'Flipkart'} | Employee: ${process.env.EMPLOYEE_NAME || 'Kasi'}</p>
    <div class="summary-cards">
      <div class="summary-card"><span class="count">${passedCount}</span>Passed</div>
      <div class="summary-card"><span class="count">${failedCount}</span>Failed</div>
      <div class="summary-card"><span class="count">${incompleteCount}</span>Incomplete</div>
      <div class="summary-card"><span class="count">${scenarioRows.length}</span>Total Scenarios</div>
    </div>
    <div class="graph-wrap">
      <h2 class="graph-title">No. of Test Cases Passed</h2>
      <div class="bar-track"><div class="bar-fill" style="width:${passedPercent}%"></div></div>
      <div class="bar-meta">${passedCount} of ${scenarioRows.length} passed (${passedPercent}%)</div>
    </div>
    <table>
      <thead>
        <tr><th>Feature</th><th>Scenario</th><th>Status</th><th>Report</th></tr>
      </thead>
      <tbody>
        ${indexRowsHtml}
      </tbody>
    </table>
    <h2 style="margin-top:20px;">Scenario and Step Details</h2>
    ${scenarioDetailsHtml}
  </body>
</html>`;

  fs.writeFileSync(path.join(htmlOutDir, 'index.html'), indexHtml);
  console.log('Scenario-level HTML reports generated at reports/scenario-html/index.html');
}

generateHtmlReport();
generateScenarioHtmlReports();

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
