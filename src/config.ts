import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { PackageManager } from './package-manager-config';

const CONFIG_PATH = join(homedir(), '.xpmrc');

function getConfig(): any {
  if (existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {}
  }
  return {};
}

function saveConfig(config: any): void {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function getPackageManager(envVar: string, configKey: string): PackageManager {
  // 1. Check environment variable
  const envPM = process.env[envVar];
  if (envPM && isValidPackageManager(envPM)) {
    return envPM as PackageManager;
  }

  // 2. Check config file
  const config = getConfig();
  if (config[configKey] && isValidPackageManager(config[configKey])) {
    return config[configKey];
  }

  // 3. Fall back to npm
  return 'npm';
}

export function getDefaultPackageManager(): PackageManager {
  return getPackageManager('XPM_DEFAULT_PM', 'defaultPackageManager');
}

export function getGlobalPackageManager(): PackageManager {
  return getPackageManager('XPM_GLOBAL_PM', 'globalPackageManager');
}

function setPackageManager(pm: string, configKey: string, displayName: string): void {
  if (!isValidPackageManager(pm)) {
    throw new Error(`Invalid package manager: ${pm}. Must be one of: npm, yarn, pnpm, bun`);
  }
  
  const config = getConfig();
  config[configKey] = pm;
  saveConfig(config);
  console.log(`${displayName} set to: ${pm}`);
}

export function setDefaultPackageManager(pm: string): void {
  setPackageManager(pm, 'defaultPackageManager', 'Default package manager');
}

export function setGlobalPackageManager(pm: string): void {
  setPackageManager(pm, 'globalPackageManager', 'Global package manager');
}

function isValidPackageManager(pm: string): boolean {
  return ['npm', 'yarn', 'pnpm', 'bun'].includes(pm);
}