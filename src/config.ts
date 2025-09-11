import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { PackageManager } from './package-manager-config';

const CONFIG_PATH = join(homedir(), '.xpmrc');

export function getDefaultPackageManager(): PackageManager {
  // 1. Check environment variable
  const envPM = process.env.XPM_DEFAULT_PM;
  if (envPM && isValidPackageManager(envPM)) {
    return envPM as PackageManager;
  }

  // 2. Check config file in home directory
  if (existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.defaultPackageManager && isValidPackageManager(config.defaultPackageManager)) {
        return config.defaultPackageManager;
      }
    } catch {}
  }

  // 3. Fall back to npm
  return 'npm';
}

export function setDefaultPackageManager(pm: string): void {
  if (!isValidPackageManager(pm)) {
    throw new Error(`Invalid package manager: ${pm}. Must be one of: npm, yarn, pnpm, bun`);
  }
  
  let config: any = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {}
  }
  
  config.defaultPackageManager = pm;
  
  // Ensure directory exists
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`Default package manager set to: ${pm}`);
}

function isValidPackageManager(pm: string): boolean {
  return ['npm', 'yarn', 'pnpm', 'bun'].includes(pm);
}