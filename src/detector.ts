import * as fs from 'fs';
import * as path from 'path';
import { PackageManager, PACKAGE_MANAGERS, SUPPORTED_PACKAGE_MANAGERS } from './package-manager-config';
import { getDefaultPackageManager } from './config';
import { INSTALL_COMMANDS, WORKSPACE_ROOT_COMMANDS } from './command-constants';

export interface DetectionResult {
  packageManager: PackageManager;
  projectRoot: string;
  isWorkspace: boolean;
  workspaceRoot?: string;
}

export function detectPackageManager(startDir = process.cwd()): DetectionResult {
  // Find nearest package.json
  let dir = startDir;
  let packageJsonDir: string | null = null;
  
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      packageJsonDir = dir;
      break;
    }
    dir = path.dirname(dir);
  }
  
  if (!packageJsonDir) throw new Error('No package.json found. Not a Node.js project directory.');
  
  // Find lockfile (might be in parent for workspaces)
  let lockfileDir: string | null = null;
  dir = packageJsonDir;
  
  while (dir !== path.dirname(dir)) {
    const hasLockfile = ['bun', 'pnpm', 'yarn', 'npm'].some(mgr => 
      fs.existsSync(path.join(dir, PACKAGE_MANAGERS[mgr as PackageManager].lockfile))
    );
    
    if (hasLockfile) {
      lockfileDir = dir;
      break;
    }
    
    const parentDir = path.dirname(dir);
    if (!fs.existsSync(path.join(parentDir, 'package.json'))) break;
    dir = parentDir;
  }
  
  const detectionRoot = lockfileDir || packageJsonDir;
  const isWorkspace = lockfileDir !== null && lockfileDir !== packageJsonDir;
  
  // Try to read package.json for corepack config
  let detectedPM: PackageManager | null = null;
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(detectionRoot, 'package.json'), 'utf-8'));
    const pmField = packageJson.packageManager ?? packageJson.devEngines?.packageManager?.name;
    if (pmField) {
      const managerName = pmField.split('@')[0] as PackageManager;
      if (SUPPORTED_PACKAGE_MANAGERS.includes(managerName)) {
        detectedPM = managerName;
      }
    }
  } catch {}
  
  // Check for lockfiles if no corepack config
  if (!detectedPM) {
    for (const manager of ['bun', 'pnpm', 'yarn', 'npm'] as PackageManager[]) {
      if (fs.existsSync(path.join(detectionRoot, PACKAGE_MANAGERS[manager].lockfile))) {
        detectedPM = manager;
        break;
      }
    }
  }
  
  // Fall back to configured default
  if (!detectedPM) {
    detectedPM = getDefaultPackageManager();
  }
  
  return {
    packageManager: detectedPM,
    projectRoot: packageJsonDir,
    isWorkspace,
    workspaceRoot: isWorkspace && lockfileDir ? lockfileDir : undefined
  };
}

export function shouldRunAtWorkspaceRoot(command: string, args: string[]): boolean {
  // Install commands with packages should run in current dir, without should run at root
  if (INSTALL_COMMANDS.includes(command as any)) {
    return args.length === 0;
  }
  
  return WORKSPACE_ROOT_COMMANDS.has(command);
}

export function isWorkspaceRoot(dir: string): boolean {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
    return !!(packageJson.workspaces || 
              fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) || 
              fs.existsSync(path.join(dir, 'pnpm-workspace.yml')));
  } catch {
    return false;
  }
}