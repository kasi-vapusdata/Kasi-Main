const { spawnSync } = require('node:child_process');

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
  baseArgs.push('--tags', npmTag);
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

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
