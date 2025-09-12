import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { PackageManager, SUPPORTED_PACKAGE_MANAGERS } from './package-manager-config';

function isValidPackageManager(pm: string): pm is PackageManager {
  return SUPPORTED_PACKAGE_MANAGERS.includes(pm as any);
}

const CONFIG_PATHS = [
  () => join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'xpm', 'config.json'),
  () => join(homedir(), '.xpmrc')
];

function getConfigPath(): string {
  for (const pathFn of CONFIG_PATHS) {
    const path = pathFn();
    if (existsSync(path)) {
      return path;
    }
  }
  // Default to XDG config for new config files
  return CONFIG_PATHS[0]();
}

interface Config {
  defaultPackageManager?: PackageManager;
  globalPackageManager?: PackageManager;
}

function getConfig(): Config {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {
      console.warn(`Failed to parse config at ${configPath}`);
    }
  }
  return {};
}

function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getPackageManager(envVar: string, configKey: keyof Config): PackageManager {
  // 1. Environment variable (highest priority)
  const envPM = process.env[envVar];
  if (envPM && isValidPackageManager(envPM)) {
    return envPM as PackageManager;
  }

  // 2. Config file
  const config = getConfig();
  if (config[configKey] && isValidPackageManager(config[configKey])) {
    return config[configKey];
  }

  // 3. Default fallback
  return 'npm';
}

export function getDefaultPackageManager(): PackageManager {
  return getPackageManager('XPM_DEFAULT_PM', 'defaultPackageManager');
}

export function getGlobalPackageManager(): PackageManager {
  return getPackageManager('XPM_GLOBAL_PM', 'globalPackageManager');
}

function setPackageManager(pm: string, configKey: keyof Config, displayName: string): void {
  if (!isValidPackageManager(pm)) {
    throw new Error(`Invalid package manager: ${pm}. Must be one of: ${SUPPORTED_PACKAGE_MANAGERS.join(', ')}`);
  }
  
  const config = getConfig();
  config[configKey] = pm as PackageManager;
  saveConfig(config);
  console.log(`${displayName} set to: ${pm}`);
}

export function setDefaultPackageManager(pm: string): void {
  setPackageManager(pm, 'defaultPackageManager', 'Default package manager');
}

export function setGlobalPackageManager(pm: string): void {
  setPackageManager(pm, 'globalPackageManager', 'Global package manager');
}

