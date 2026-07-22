const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const { generateReports } = require('../report/cucumberReportGenerator');

const DEFAULT_FEATURE_GLOB = 'src/test/features/**/*.feature';

function readOption(args, names) {
  for (const name of names) {
    const equalsArg = args.find((arg) => arg.startsWith(`${name}=`));
    if (equalsArg) {
      return equalsArg.slice(name.length + 1);
    }

    const index = args.indexOf(name);
    if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) {
      return args[index + 1];
    }
  }

  return undefined;
}

function hasFlag(args, names) {
  return names.some((name) => args.includes(name));
}

function removeRunnerOptions(args) {
  const runnerOptionsWithValues = new Set([
    '--tag',
    '--tags',
    '-t',
    '--feature',
    '--features',
    '--folder',
    '--name',
    '--scenario',
  ]);
  const runnerFlags = new Set(['--all', '--help', '-h']);
  const passthrough = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const optionName = arg.includes('=') ? arg.split('=')[0] : arg;

    if (runnerFlags.has(optionName)) {
      continue;
    }

    if (runnerOptionsWithValues.has(optionName)) {
      if (!arg.includes('=')) {
        index += 1;
      }
      continue;
    }

    passthrough.push(arg);
  }

  return passthrough;
}

function normalizePath(inputPath) {
  if (!inputPath) {
    return undefined;
  }

  const normalized = inputPath.replace(/\\/g, '/');
  if (normalized.includes('*')) {
    return normalized;
  }

  if (normalized.endsWith('.feature')) {
    return normalized;
  }

  return `${normalized.replace(/\/+$/g, '')}/**/*.feature`;
}

function resolveFeaturePath(args) {
  const feature = readOption(args, ['--feature', '--features']) || process.env.npm_config_feature || process.env.npm_config_features;
  if (feature) {
    return normalizePath(feature);
  }

  const folder = readOption(args, ['--folder']) || process.env.npm_config_folder;
  if (folder) {
    return normalizePath(folder);
  }

  return DEFAULT_FEATURE_GLOB;
}

function buildCucumberArgs(rawArgs) {
  const featurePath = resolveFeaturePath(rawArgs);
  const tagExpression = readOption(rawArgs, ['--tag', '--tags', '-t']) || process.env.npm_config_tag || process.env.npm_config_tags;
  const scenarioName = readOption(rawArgs, ['--name', '--scenario']) || process.env.npm_config_name || process.env.npm_config_scenario;
  const passthroughArgs = removeRunnerOptions(rawArgs);

  const cucumberArgs = [
    featurePath,
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

  if (tagExpression) {
    cucumberArgs.push('--tags', tagExpression);
  }

  if (scenarioName) {
    cucumberArgs.push('--name', scenarioName);
  }

  cucumberArgs.push(...passthroughArgs);

  return {
    cucumberArgs,
    summary: {
      featurePath,
      tagExpression: tagExpression || 'ALL',
      scenarioName: scenarioName || 'ALL',
    },
  };
}

function printHelp() {
  console.log(`Flexible Cucumber runner

Examples:
  npm run test:flex
  npm run test:flex --tag "@ELEC_RH_PUC_FDC"
  npm run test:flex -- --tag "@ELEC_RH_PUC_FDC"
  npm run test:flex --feature src/test/features/Claims.feature
  npm run test:flex --folder src/test/features
  npm run test:flex -- --name "Download the Electronics PDC RH file and verify data"

Options:
  --tag, --tags, -t    Cucumber tag expression
  --feature           Single .feature file or glob
  --folder            Folder that contains feature files
  --name, --scenario  Scenario name expression
  --all               Run all features, same as no filter

NPM config style is also supported:
  npm run test:flex --tag "@smoke"
  npm run test:flex --feature src/test/features/Claims.feature
`);
}

function main(rawArgs = process.argv.slice(2)) {
  if (hasFlag(rawArgs, ['--help', '-h'])) {
    printHelp();
    return 0;
  }

  const { cucumberArgs, summary } = buildCucumberArgs(rawArgs);
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  if (!summary.featurePath.includes('*') && !fs.existsSync(path.resolve(summary.featurePath))) {
    console.warn(`Feature path does not exist yet: ${summary.featurePath}`);
  }

  console.log(`Flexible run => features: ${summary.featurePath} | tags: ${summary.tagExpression} | scenario: ${summary.scenarioName}`);

  const result = spawnSync(cmd, ['cucumber-js', ...cucumberArgs], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ENV: process.env.ENV || 'prod',
    },
  });

  generateReports();

  return typeof result.status === 'number' ? result.status : 1;
}

module.exports = {
  buildCucumberArgs,
  main,
  normalizePath,
  readOption,
  removeRunnerOptions,
  resolveFeaturePath,
};

if (require.main === module) {
  process.exit(main());
}