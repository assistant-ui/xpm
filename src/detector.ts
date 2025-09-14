import * as fs from 'fs';
import * as path from 'path';
import { BasePackageManager } from './base-package-manager';
import { registry, PackageManagerName } from './package-manager-registry';
import { getDefaultPackageManager } from './config';
import { INSTALL_COMMANDS, WORKSPACE_ROOT_COMMANDS } from './command-constants';

export interface DetectionResult {
  packageManager: BasePackageManager;
  projectRoot: string;
  isWorkspace: boolean;
  workspaceRoot?: string;
}

export function detectPackageManager(startDir = process.cwd()): DetectionResult {
  // Find project root based on ecosystem
  const projectRoot = registry.findProjectRoot(startDir);
  if (!projectRoot) {
    throw new Error('No project root found. Not in a recognized project directory.');
  }

  // Detect the package manager
  let detectedManager = registry.detectFromDirectory(projectRoot);

  // For JavaScript projects, check for workspace root
  let workspaceRoot: string | undefined;
  let isWorkspace = false;

  if (detectedManager && detectedManager.ecosystem === 'javascript') {
    // Search up for workspace root (lockfile might be in parent)
    let dir = projectRoot;
    let lockfileDir: string | null = null;

    while (dir !== path.dirname(dir)) {
      // Check for lockfiles in current directory
      for (const lockFileName of detectedManager.lockFileNames) {
        if (fs.existsSync(path.join(dir, lockFileName))) {
          lockfileDir = dir;
          break;
        }
      }

      if (lockfileDir && lockfileDir !== projectRoot) {
        workspaceRoot = lockfileDir;
        isWorkspace = true;
        break;
      }

      // Move up one directory
      const parentDir = path.dirname(dir);

      // Continue searching if parent has package.json (could be workspace root)
      if (fs.existsSync(path.join(parentDir, 'package.json'))) {
        dir = parentDir;
      } else {
        break;
      }
    }

    // Try to read package.json for corepack config
    const detectionRoot = workspaceRoot || projectRoot;
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(detectionRoot, 'package.json'), 'utf-8'));
      const pmField = packageJson.packageManager ?? packageJson.devEngines?.packageManager?.name;
      if (pmField) {
        const managerName = pmField.split('@')[0];
        const manager = registry.get(managerName);
        if (manager) {
          detectedManager = manager;
        }
      }
    } catch {}
  }

  // Fall back to configured default
  if (!detectedManager) {
    const defaultPMName = getDefaultPackageManager();
    detectedManager = registry.get(defaultPMName);
    if (!detectedManager) {
      // Fallback to npm if default is not found
      detectedManager = registry.get('npm')!;
    }
  }

  return {
    packageManager: detectedManager,
    projectRoot,
    isWorkspace,
    workspaceRoot
  };
}

export function findExistingLockfile(pm: BasePackageManager, dir: string): string | undefined {
  for (const name of pm.lockFileNames) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
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
