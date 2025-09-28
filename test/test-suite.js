#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const XPM_CLI = path.join(__dirname, '..', 'dist', 'cli.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Test definitions
const tests = [
  // JavaScript Package Managers
  {
    name: 'NPM Detection',
    dir: 'js-npm',
    expectedPM: 'npm',
    commands: [
      { cmd: 'install', expected: 'npm install' },
      { cmd: 'install express', expected: 'npm install express' },
      { cmd: 'install -D eslint', expected: 'npm install -D eslint' },
      { cmd: 'remove express', expected: 'npm uninstall express' },
      { cmd: 'update', expected: 'npm update' },
      { cmd: 'test', expected: 'npm run test' },
      { cmd: 'build', expected: 'npm run build' }
    ]
  },
  {
    name: 'Yarn Detection',
    dir: 'js-yarn',
    expectedPM: 'yarn',
    commands: [
      { cmd: 'install', expected: 'yarn install' },
      { cmd: 'install express', expected: 'yarn add express' },
      { cmd: 'install -D eslint', expected: 'yarn add -D eslint' },
      { cmd: 'remove express', expected: 'yarn remove express' },
      { cmd: 'update', expected: 'yarn upgrade' },
      { cmd: 'test', expected: 'yarn test' },
      { cmd: 'build', expected: 'yarn build' }
    ]
  },
  {
    name: 'PNPM Detection',
    dir: 'js-pnpm',
    expectedPM: 'pnpm',
    commands: [
      { cmd: 'install', expected: 'pnpm install' },
      { cmd: 'install express', expected: 'pnpm add express' },
      { cmd: 'install -D eslint', expected: 'pnpm add -D eslint' },
      { cmd: 'remove express', expected: 'pnpm remove express' },
      { cmd: 'update', expected: 'pnpm update' },
      { cmd: 'test', expected: 'pnpm test' },
      { cmd: 'build', expected: 'pnpm build' }
    ]
  },
  {
    name: 'Bun Detection',
    dir: 'js-bun',
    expectedPM: 'bun',
    commands: [
      { cmd: 'install', expected: 'bun install' },
      { cmd: 'install express', expected: 'bun add express' },
      { cmd: 'install -D eslint', expected: 'bun add -d eslint' },
      { cmd: 'remove express', expected: 'bun remove express' },
      { cmd: 'update', expected: 'bun update' },
      { cmd: 'test', expected: 'bun test' },
      { cmd: 'build', expected: 'bun build' }
    ]
  },
  {
    name: 'Deno Detection',
    dir: 'js-deno',
    expectedPM: 'deno',
    commands: [
      { cmd: 'install', expected: 'deno install' },
      { cmd: 'install express', expected: 'deno add express' },
      { cmd: 'install --dev eslint', expected: 'deno add --dev eslint' },
      { cmd: 'remove express', expected: 'deno remove express' },
      { cmd: 'update', expected: 'deno update' },
      { cmd: 'test', expected: 'deno task test' },
      { cmd: 'build', expected: 'deno task build' }
    ]
  },

  // Python Package Managers
  {
    name: 'Pip Detection',
    dir: 'py-pip',
    expectedPM: 'pip',
    commands: [
      { cmd: 'install', expected: 'pip install' },
      { cmd: 'install flask', expected: 'pip install flask' },
      { cmd: 'remove flask', expected: 'pip uninstall flask' },
      { cmd: 'update flask', expected: 'pip install --upgrade flask' }
    ]
  },
  {
    name: 'Pipenv Detection',
    dir: 'py-pipenv',
    expectedPM: 'pipenv',
    commands: [
      { cmd: 'install', expected: 'pipenv install' },
      { cmd: 'install flask', expected: 'pipenv install flask' },
      { cmd: 'install --dev pytest', expected: 'pipenv install --dev pytest' },
      { cmd: 'remove flask', expected: 'pipenv uninstall flask' }
    ]
  },
  {
    name: 'Poetry Detection',
    dir: 'py-poetry',
    expectedPM: 'poetry',
    commands: [
      { cmd: 'install', expected: 'poetry install' },
      { cmd: 'install flask', expected: 'poetry add flask' },
      { cmd: 'install --dev pytest', expected: 'poetry add --dev pytest' },
      { cmd: 'remove flask', expected: 'poetry remove flask' }
    ]
  },
  {
    name: 'UV Detection',
    dir: 'py-uv',
    expectedPM: 'uv',
    commands: [
      { cmd: 'install', expected: 'uv sync' },
      { cmd: 'install flask', expected: 'uv add flask' },
      { cmd: 'install --dev pytest', expected: 'uv add --dev pytest' },
      { cmd: 'remove flask', expected: 'uv remove flask' }
    ]
  },
  {
    name: 'Conda Detection',
    dir: 'py-conda',
    expectedPM: 'conda',
    commands: [
      { cmd: 'install', expected: 'conda install' },
      { cmd: 'install flask', expected: 'conda install flask' },
      { cmd: 'remove flask', expected: 'conda remove flask' }
    ]
  },

  // Workspace tests
  {
    name: 'NPM Workspace',
    dir: 'workspace-npm',
    expectedPM: 'npm',
    commands: [
      { cmd: 'install', expected: 'npm install', fromRoot: true },
      { cmd: 'install express', expected: 'npm install express', fromSubdir: 'packages/app' }
    ]
  },
  {
    name: 'PNPM Workspace',
    dir: 'workspace-pnpm',
    expectedPM: 'pnpm',
    commands: [
      { cmd: 'install', expected: 'pnpm install', fromRoot: true },
      { cmd: 'install express', expected: 'pnpm add express', fromSubdir: 'packages/app' }
    ]
  },
  {
    name: 'Yarn Workspace',
    dir: 'workspace-yarn',
    expectedPM: 'yarn',
    commands: [
      { cmd: 'install', expected: 'yarn install', fromRoot: true },
      { cmd: 'install express', expected: 'yarn add express', fromSubdir: 'packages/app' }
    ]
  }
];

// Test runner
async function runCommand(cmd, cwd) {
  return new Promise((resolve) => {
    const child = spawn('node', [XPM_CLI, '--dry-run', ...cmd.split(' ')], {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '0' }
    });

    let output = '';
    child.stdout.on('data', (data) => output += data.toString());
    child.stderr.on('data', (data) => output += data.toString());

    child.on('close', () => {
      resolve(output.trim());
    });
  });
}

async function runTest(test) {
  console.log(`\n${colors.bold}${colors.blue}Testing: ${test.name}${colors.reset}`);
  console.log(`${colors.cyan}Directory: ${test.dir}${colors.reset}`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const command of test.commands) {
    let testDir = path.join(FIXTURES_DIR, test.dir);

    // Handle subdirectory tests for workspaces
    if (command.fromSubdir) {
      testDir = path.join(testDir, command.fromSubdir);
    }

    const output = await runCommand(command.cmd, testDir);

    // Extract the command from dry-run output
    const match = output.match(/\[dry-run\] Would execute: (.+?) \(/);
    const actualCommand = match ? match[1] : output;

    // Check if the output matches expected
    const success = actualCommand.includes(command.expected);

    if (success) {
      console.log(`  ${colors.green}✓${colors.reset} ${command.cmd} → ${actualCommand}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${command.cmd}`);
      console.log(`    Expected: ${command.expected}`);
      console.log(`    Got:      ${actualCommand}`);
      failed++;
      failures.push({ cmd: command.cmd, expected: command.expected, got: actualCommand });
    }
  }

  return { passed, failed, failures };
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}       XPM Package Manager Test Suite${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}`);

  let totalPassed = 0;
  let totalFailed = 0;
  const failedTests = [];

  // Check if dist/cli.js exists
  if (!fs.existsSync(XPM_CLI)) {
    console.error(`${colors.red}Error: ${XPM_CLI} not found. Please run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }

  for (const test of tests) {
    const result = await runTest(test);
    totalPassed += result.passed;
    totalFailed += result.failed;

    if (result.failed > 0) {
      failedTests.push({ name: test.name, failures: result.failures });
    }
  }

  // Summary
  console.log(`\n${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}Test Summary:${colors.reset}`);
  console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}`);

  if (failedTests.length > 0) {
    console.log(`\n${colors.bold}${colors.red}Failed Tests:${colors.reset}`);
    for (const test of failedTests) {
      console.log(`  ${colors.yellow}${test.name}:${colors.reset}`);
      for (const failure of test.failures) {
        console.log(`    - ${failure.cmd}`);
      }
    }
    process.exit(1);
  } else {
    console.log(`\n${colors.bold}${colors.green}All tests passed! 🎉${colors.reset}`);
  }
}

// Special tests for global installs
async function testGlobalInstalls() {
  console.log(`\n${colors.bold}${colors.blue}Testing: Global Installs${colors.reset}`);

  const globalTests = [
    { pm: 'npm', cmd: 'install -g typescript', expected: 'npm install -g typescript' },
    { pm: 'pnpm', cmd: 'install -g typescript', expected: 'pnpm add -g typescript' },
    { pm: 'bun', cmd: 'install -g typescript', expected: 'bun add -g typescript' },
    { pm: 'deno', cmd: 'install -g typescript', expected: 'deno add --global typescript' }
  ];

  for (const test of globalTests) {
    // Set global package manager via environment variable
    const env = { ...process.env, XPM_GLOBAL_PM: test.pm, FORCE_COLOR: '0' };

    const child = spawn('node', [XPM_CLI, '--dry-run', ...test.cmd.split(' ')], {
      cwd: FIXTURES_DIR,
      stdio: 'pipe',
      env
    });

    let output = '';
    await new Promise((resolve) => {
      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => output += data.toString());
      child.on('close', resolve);
    });

    const match = output.match(/\[dry-run\] Would execute: (.+?)$/m);
    const actualCommand = match ? match[1] : output.trim();
    const success = actualCommand === test.expected;

    if (success) {
      console.log(`  ${colors.green}✓${colors.reset} ${test.pm}: ${test.cmd} → ${actualCommand}`);
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${test.pm}: ${test.cmd}`);
      console.log(`    Expected: ${test.expected}`);
      console.log(`    Got:      ${actualCommand}`);
    }
  }
}

// Run tests
(async () => {
  await runAllTests();
  await testGlobalInstalls();
})().catch(console.error);