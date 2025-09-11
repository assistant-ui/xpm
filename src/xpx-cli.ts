#!/usr/bin/env node

import { spawn } from 'child_process';
import { detectPackageManager } from './detector';

// Map package managers to their execute commands
const executorMap = {
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
  const executor = executorMap[packageManager];
  
  // For yarn v1, fall back to npx since it doesn't have dlx
  const finalExecutor = packageManager === 'yarn' ? ['yarn', 'dlx'] : [executor];
  const finalArgs = packageManager === 'yarn' ? args : args;
  
  // Execute the command
  const child = spawn(finalExecutor[0], [...finalExecutor.slice(1), ...finalArgs], {
    stdio: 'inherit',
    shell: false
  });

  child.on('exit', (code) => process.exit(code || 0));
  child.on('error', (error) => {
    console.error(`Failed to execute ${finalExecutor[0]}: ${error.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}