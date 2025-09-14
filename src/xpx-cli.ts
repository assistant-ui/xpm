#!/usr/bin/env node

import { spawn } from 'child_process';
import { detectPackageManager } from './detector';

// Map package managers to their execute commands
const executorMap: Record<string, string> = {
  npm: 'npx',
  yarn: 'dlx',  // yarn dlx for Yarn 2+, yarn v1 doesn't have equivalent
  pnpm: 'pnpx', // or could use 'pnpm dlx'
  bun: 'bunx'
};

const args = process.argv.slice(2);

// Show help
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`xpx - Universal package executor

Usage: xpx [package] [...args]

Runs the correct package executor for your project:
  npm  → npx
  yarn → yarn dlx
  pnpm → pnpx
  bun  → bunx

Examples:
  xpx create-react-app my-app
  xpx prettier --write .
  xpx eslint --fix src/`);
  process.exit(0);
}

// Show version
if (args.includes('--version') || args.includes('-v')) {
  console.log('xpx version 1.0.0');
  process.exit(0);
}

try {
  const { packageManager } = detectPackageManager();
  const executor = executorMap[packageManager.name];

  if (!executor) {
    console.error(`Package executor not available for ${packageManager.name}`);
    process.exit(1);
  }

  // Build executor command
  let execCommand: string;
  let execArgs: string[];

  if (packageManager.name === 'yarn') {
    execCommand = 'yarn';
    execArgs = ['dlx', ...args];
  } else {
    execCommand = executor;
    execArgs = args;
  }
  
  // Execute the command
  const child = spawn(execCommand, execArgs, {
    stdio: 'inherit',
    shell: false
  });

  child.on('exit', (code) => process.exit(code || 0));
  child.on('error', (error) => {
    console.error(`Failed to execute ${execCommand}: ${error.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}