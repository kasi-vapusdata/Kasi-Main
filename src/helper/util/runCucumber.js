const { spawnSync } = require('node:child_process');
const { generateReports } = require('../report/cucumberReportGenerator');

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

const npmTag = process.env.npm_config_tag || process.env.npm_config_tags;
const effectiveCliArgs = [...cliArgs];

if (!hasTagsArg && npmTag) {
  effectiveCliArgs.push('--tags', npmTag);
}

const args = [...baseArgs, ...effectiveCliArgs];
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const result = spawnSync(cmd, ['cucumber-js', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ENV: process.env.ENV || 'prod',
  },
});

generateReports();

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
