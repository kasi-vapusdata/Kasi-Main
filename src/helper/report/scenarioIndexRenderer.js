const os = require('os');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(nanoseconds) {
  const duration = Number(nanoseconds || 0);
  if (!duration) {
    return '0s';
  }

  const milliseconds = duration / 1000000;
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function getScenarioDuration(scenario) {
  return (scenario.steps || []).reduce((total, step) => total + Number(step.result && step.result.duration ? step.result.duration : 0), 0);
}

function getScenarioArtifacts(scenario, reportFileName) {
  const artifacts = new Map();
  artifacts.set('report', { label: 'Report', href: `./${reportFileName}` });

  for (const step of scenario.steps || []) {
    for (const embedding of step.embeddings || []) {
      const mimeType = String(embedding.mime_type || '').toLowerCase();
      if (mimeType.startsWith('image/')) {
        artifacts.set('screenshot', { label: 'Screenshot', href: `./${reportFileName}` });
      } else if (mimeType.startsWith('video/')) {
        artifacts.set('video', { label: 'Video', href: `./${reportFileName}` });
      } else if (mimeType === 'text/plain') {
        artifacts.set('logs', { label: 'Logs', href: `./${reportFileName}` });
      } else if (mimeType) {
        artifacts.set('attachments', { label: 'Attachments', href: `./${reportFileName}` });
      }
    }
  }

  return Array.from(artifacts.values());
}

function createReportMetadata() {
  return {
    browser: process.env.BROWSER || 'firefox',
    device: `${os.hostname()} - PC`,
    os: `${process.platform} ${os.release()}`,
    environment: process.env.ENV || 'Sandbox',
    executionTime: new Date().toLocaleString(),
    clientName: process.env.CLIENT_NAME || 'Flipkart',
    employeeName: process.env.EMPLOYEE_NAME || 'Kasi',
  };
}

function createScenarioRow(feature, scenario, reportFileName, fallbackName) {
  return {
    featureName: feature.name || 'Feature',
    scenarioName: scenario.name || fallbackName,
    status: getScenarioStatus(scenario),
    durationNanos: getScenarioDuration(scenario),
    duration: formatDuration(getScenarioDuration(scenario)),
    artifacts: getScenarioArtifacts(scenario, reportFileName),
  };
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

function groupScenariosByFeature(scenarioRows, metadata) {
  const featureMap = new Map();

  for (const scenario of scenarioRows) {
    if (!featureMap.has(scenario.featureName)) {
      featureMap.set(scenario.featureName, {
        name: scenario.featureName,
        scenarios: [],
        total: 0,
        passed: 0,
        failed: 0,
        incomplete: 0,
        durationNanos: 0,
        metadata,
      });
    }

    const feature = featureMap.get(scenario.featureName);
    feature.scenarios.push(scenario);
    feature.total += 1;
    feature.durationNanos += scenario.durationNanos;

    if (scenario.status === 'passed') {
      feature.passed += 1;
    } else if (scenario.status === 'failed') {
      feature.failed += 1;
    } else {
      feature.incomplete += 1;
    }
  }

  return Array.from(featureMap.values()).map((feature) => ({
    ...feature,
    duration: formatDuration(feature.durationNanos),
  }));
}

function aggregateReportData(features, metadata) {
  const summary = features.reduce(
    (total, feature) => ({
      features: total.features + 1,
      scenarios: total.scenarios + feature.total,
      passed: total.passed + feature.passed,
      failed: total.failed + feature.failed,
      incomplete: total.incomplete + feature.incomplete,
      durationNanos: total.durationNanos + feature.durationNanos,
    }),
    { features: 0, scenarios: 0, passed: 0, failed: 0, incomplete: 0, durationNanos: 0 }
  );

  return {
    metadata,
    features,
    summary: {
      ...summary,
      duration: formatDuration(summary.durationNanos),
      passedPercent: summary.scenarios ? Math.round((summary.passed / summary.scenarios) * 100) : 0,
    },
  };
}

function renderArtifactLinks(artifacts) {
  if (!artifacts.length) {
    return '<span class="muted">None</span>';
  }

  return artifacts
    .map((artifact) => `<a class="artifact-link" href="${escapeHtml(artifact.href)}" target="_blank">${escapeHtml(artifact.label)}</a>`)
    .join('');
}

function renderScenarioRows(scenarios) {
  return scenarios
    .map(
      (scenario) => `
              <tr>
                <td class="scenario-name">${escapeHtml(scenario.scenarioName)}</td>
                <td><span class="status-pill ${escapeHtml(scenario.status)}">${escapeHtml(scenario.status)}</span></td>
                <td>${escapeHtml(scenario.duration)}</td>
                <td><div class="artifact-list">${renderArtifactLinks(scenario.artifacts)}</div></td>
              </tr>`
    )
    .join('');
}

function renderFeature(feature, index) {
  return `
      <section class="feature-card" data-feature-card>
        <button class="feature-toggle" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
          <span class="feature-title-wrap">
            <span class="chevron" aria-hidden="true">›</span>
            <span>
              <span class="feature-title">${escapeHtml(feature.name)}</span>
              <span class="feature-subtitle">${feature.total} scenarios · ${escapeHtml(feature.duration)}</span>
            </span>
          </span>
          <span class="feature-status ${feature.failed ? 'failed' : feature.incomplete ? 'incomplete' : 'passed'}">${feature.failed ? `${feature.failed} failed` : feature.incomplete ? `${feature.incomplete} incomplete` : 'passed'}</span>
        </button>
        <div class="feature-body" ${index === 0 ? '' : 'hidden'}>
          <div class="feature-metrics">
            <div><span>Total Scenarios</span><strong>${feature.total}</strong></div>
            <div><span>Passed</span><strong>${feature.passed}</strong></div>
            <div><span>Failed</span><strong>${feature.failed}</strong></div>
            <div><span>Execution Time</span><strong>${escapeHtml(feature.duration)}</strong></div>
            <div><span>Device</span><strong>${escapeHtml(feature.metadata.device)}</strong></div>
            <div><span>Browser</span><strong>${escapeHtml(feature.metadata.browser)}</strong></div>
            <div><span>OS</span><strong>${escapeHtml(feature.metadata.os)}</strong></div>
            <div><span>Environment</span><strong>${escapeHtml(feature.metadata.environment)}</strong></div>
          </div>
          <table class="scenario-table">
            <thead>
              <tr><th>Scenario Name</th><th>Status</th><th>Duration</th><th>Artifacts</th></tr>
            </thead>
            <tbody>${renderScenarioRows(feature.scenarios)}
            </tbody>
          </table>
        </div>
      </section>`;
}

function renderReportHtml(reportModel) {
  const featuresHtml = reportModel.features.map(renderFeature).join('\n');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scenario Reports</title>
    <style>
      :root { color-scheme: light; --ink:#172033; --muted:#667085; --line:#d9e1ec; --panel:#ffffff; --page:#f5f7fb; --accent:#2454d6; --pass:#16803c; --fail:#b42318; --warn:#b54708; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: "Aptos", "Segoe UI", sans-serif; background: var(--page); color: var(--ink); }
      main { padding: 28px; max-width: 1440px; margin: 0 auto; }
      h1 { margin: 0; font-size: 28px; font-weight: 760; letter-spacing: 0; }
      .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 18px; }
      .header p { margin: 8px 0 0; color: var(--muted); }
      .summary-cards { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 12px; margin: 18px 0; }
      .summary-card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; }
      .summary-card span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; }
      .summary-card strong { display: block; margin-top: 6px; font-size: 22px; }
      .progress-panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin-bottom: 18px; }
      .bar-track { width: 100%; height: 14px; border-radius: 999px; background: #e6ebf2; overflow: hidden; }
      .bar-fill { height: 100%; background: linear-gradient(90deg, #1b7f42, #2f9f62); }
      .bar-meta { margin-top: 8px; color: var(--muted); font-size: 13px; }
      .feature-list { display: grid; gap: 12px; }
      .feature-card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
      .feature-toggle { width: 100%; border: 0; background: #fff; padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; color: inherit; text-align: left; }
      .feature-title-wrap { display: flex; align-items: center; gap: 12px; min-width: 0; }
      .chevron { font-size: 28px; line-height: 1; color: var(--accent); transform: rotate(0deg); transition: transform 120ms ease; }
      .feature-toggle[aria-expanded="true"] .chevron { transform: rotate(90deg); }
      .feature-title { display: block; font-size: 18px; font-weight: 760; overflow-wrap: anywhere; }
      .feature-subtitle { display: block; margin-top: 3px; color: var(--muted); font-size: 13px; }
      .feature-status, .status-pill { border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 760; text-transform: uppercase; white-space: nowrap; }
      .passed { background: #dcfce7; color: var(--pass); }
      .failed { background: #fee4e2; color: var(--fail); }
      .incomplete, .skipped, .pending, .undefined { background: #fef0c7; color: var(--warn); }
      .feature-body { border-top: 1px solid var(--line); padding: 16px 18px 18px; }
      .feature-metrics { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px; }
      .feature-metrics div { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: #fbfcff; min-width: 0; }
      .feature-metrics span { display: block; color: var(--muted); font-size: 12px; }
      .feature-metrics strong { display: block; margin-top: 5px; overflow-wrap: anywhere; }
      .scenario-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .scenario-table th, .scenario-table td { border-bottom: 1px solid var(--line); padding: 10px 8px; text-align: left; vertical-align: top; }
      .scenario-table th { font-size: 12px; color: var(--muted); text-transform: uppercase; background: #f8fafc; }
      .scenario-table th:nth-child(1) { width: 48%; }
      .scenario-table th:nth-child(2) { width: 14%; }
      .scenario-table th:nth-child(3) { width: 14%; }
      .scenario-name { overflow-wrap: anywhere; }
      .artifact-list { display: flex; gap: 6px; flex-wrap: wrap; }
      .artifact-link { border: 1px solid #b7c5dd; color: #1c4598; background: #f7faff; border-radius: 999px; padding: 4px 8px; text-decoration: none; font-size: 12px; font-weight: 650; }
      .muted { color: var(--muted); }
      @media (max-width: 900px) { main { padding: 16px; } .header { display: block; } .summary-cards, .feature-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .scenario-table { table-layout: auto; } }
      @media (max-width: 640px) { .summary-cards, .feature-metrics { grid-template-columns: 1fr; } .feature-toggle { align-items: flex-start; } .scenario-table, .scenario-table thead, .scenario-table tbody, .scenario-table tr, .scenario-table th, .scenario-table td { display: block; width: 100%; } .scenario-table thead { display: none; } .scenario-table tr { border-bottom: 1px solid var(--line); padding: 8px 0; } .scenario-table td { border: 0; padding: 6px 0; } }
    </style>
  </head>
  <body>
    <main>
      <div class="header">
        <div>
          <h1>Feature Execution Report</h1>
          <p>Client: ${escapeHtml(reportModel.metadata.clientName)} | Employee: ${escapeHtml(reportModel.metadata.employeeName)}</p>
        </div>
      </div>
      <div class="summary-cards">
        <div class="summary-card"><span>Features</span><strong>${reportModel.summary.features}</strong></div>
        <div class="summary-card"><span>Scenarios</span><strong>${reportModel.summary.scenarios}</strong></div>
        <div class="summary-card"><span>Passed</span><strong>${reportModel.summary.passed}</strong></div>
        <div class="summary-card"><span>Failed</span><strong>${reportModel.summary.failed}</strong></div>
        <div class="summary-card"><span>Incomplete</span><strong>${reportModel.summary.incomplete}</strong></div>
        <div class="summary-card"><span>Duration</span><strong>${escapeHtml(reportModel.summary.duration)}</strong></div>
      </div>
      <div class="progress-panel">
        <div class="bar-track"><div class="bar-fill" style="width:${reportModel.summary.passedPercent}%"></div></div>
        <div class="bar-meta">${reportModel.summary.passed} of ${reportModel.summary.scenarios} scenarios passed (${reportModel.summary.passedPercent}%)</div>
      </div>
      <div class="feature-list">
        ${featuresHtml}
      </div>
    </main>
    <script>
      document.querySelectorAll('[data-feature-card]').forEach((card) => {
        const toggle = card.querySelector('.feature-toggle');
        const body = card.querySelector('.feature-body');
        toggle.addEventListener('click', () => {
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', String(!isExpanded));
          body.hidden = isExpanded;
        });
      });
    </script>
  </body>
</html>`;
}

function buildReportModel(scenarioRows, metadata = createReportMetadata()) {
  const features = groupScenariosByFeature(scenarioRows, metadata);
  return aggregateReportData(features, metadata);
}

function renderScenarioIndex(scenarioRows, metadata) {
  return renderReportHtml(buildReportModel(scenarioRows, metadata));
}

module.exports = {
  aggregateReportData,
  buildReportModel,
  createReportMetadata,
  createScenarioRow,
  escapeHtml,
  formatDuration,
  getScenarioArtifacts,
  getScenarioDuration,
  getScenarioStatus,
  groupScenariosByFeature,
  renderReportHtml,
  renderScenarioIndex,
};