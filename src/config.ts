import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { PackageManagerName, registry } from './package-manager-registry';

function isValidPackageManager(pm: string): pm is PackageManagerName {
  return registry.get(pm) !== undefined;
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
  defaultPackageManager?: PackageManagerName;
  globalPackageManager?: PackageManagerName;
  bunScriptMode?: 'auto' | 'script' | 'builtin';
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

type PackageManagerConfigKey = 'defaultPackageManager' | 'globalPackageManager';

function getPackageManager(envVar: string, configKey: PackageManagerConfigKey): PackageManagerName {
  // 1. Environment variable (highest priority)
  const envPM = process.env[envVar];
  if (envPM && isValidPackageManager(envPM)) {
    return envPM as PackageManagerName;
  }

  // 2. Config file
  const config = getConfig();
  if (config[configKey] && isValidPackageManager(config[configKey])) {
    return config[configKey];
  }

  // 3. Default fallback
  return 'npm';
}

export function getDefaultPackageManager(): PackageManagerName {
  return getPackageManager('XPM_DEFAULT_PM', 'defaultPackageManager');
}

export function getGlobalPackageManager(): PackageManagerName {
  return getPackageManager('XPM_GLOBAL_PM', 'globalPackageManager');
}

export function getBunScriptMode(): 'auto' | 'script' | 'builtin' {
  const config = getConfig();
  const mode = config.bunScriptMode;
  if (mode && !['auto', 'script', 'builtin'].includes(mode)) {
    console.warn(`Invalid bun-script-mode '${mode}' in config, defaulting to 'builtin'`);
    return 'builtin';
  }
  return mode || 'builtin';
}

function setBunScriptMode(mode: string): void {
  if (!['auto', 'script', 'builtin'].includes(mode)) {
    console.warn(`Invalid bun-script-mode '${mode}', setting to default 'builtin'`);
    mode = 'builtin';
  }
  const config = getConfig();
  config.bunScriptMode = mode as 'auto' | 'script' | 'builtin';
  saveConfig(config);
  console.log(`Bun script mode set to: ${mode}`);
}

export { setBunScriptMode };

function setPackageManager(pm: string, configKey: PackageManagerConfigKey, displayName: string): void {
  if (!isValidPackageManager(pm)) {
    const allManagers = registry.getAllManagers().map(m => m.name).join(', ');
    throw new Error(`Invalid package manager: ${pm}. Must be one of: ${allManagers}`);
  }

  const config = getConfig();
  config[configKey] = pm as PackageManagerName;
  saveConfig(config);
  console.log(`${displayName} set to: ${pm}`);
}

export function setDefaultPackageManager(pm: string): void {
  setPackageManager(pm, 'defaultPackageManager', 'Default package manager');
}

export function setGlobalPackageManager(pm: string): void {
  setPackageManager(pm, 'globalPackageManager', 'Global package manager');
}

