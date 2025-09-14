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

  // For JavaScript projects, first search up for lockfiles to determine package manager
  let detectedManager: BasePackageManager | undefined;
  let workspaceRoot: string | undefined;
  let isWorkspace = false;

  const ecosystem = registry.detectEcosystem(projectRoot);

  if (ecosystem === 'javascript') {
    // Search up the tree for lockfiles to determine the package manager
    let dir = startDir;
    let lockfileDir: string | undefined;
    let lockfileManager: BasePackageManager | undefined;

    while (dir !== path.dirname(dir)) {
      // Check all JavaScript package managers' lockfiles
      const jsManagers = registry.getByEcosystem('javascript');
      for (const manager of jsManagers) {
        for (const lockFileName of manager.lockFileNames) {
          if (fs.existsSync(path.join(dir, lockFileName))) {
            lockfileDir = dir;
            lockfileManager = manager;
            break;
          }
        }
        if (lockfileManager) break;
      }

      if (lockfileManager) {
        detectedManager = lockfileManager;
        if (lockfileDir !== projectRoot) {
          workspaceRoot = lockfileDir;
          isWorkspace = true;
        }
        break;
      }

      // Move up one directory
      const parentDir = path.dirname(dir);

      // Stop if we've reached the root of the filesystem
      if (parentDir === dir) {
        break;
      }

      // Continue searching if:
      // 1. Parent has package.json (could be workspace root)
      // 2. Parent's parent has package.json (we might be in packages/ dir)
      // 3. We're still within a reasonable project structure (max 5 levels up)
      const parentHasPackageJson = fs.existsSync(path.join(parentDir, 'package.json'));
      const grandparentDir = path.dirname(parentDir);
      const grandparentHasPackageJson = grandparentDir !== parentDir &&
                                        fs.existsSync(path.join(grandparentDir, 'package.json'));

      if (parentHasPackageJson || grandparentHasPackageJson) {
        dir = parentDir;
      } else {
        // One more check: if parent has common workspace config files
        const hasWorkspaceConfig = fs.existsSync(path.join(parentDir, 'pnpm-workspace.yaml')) ||
                                   fs.existsSync(path.join(parentDir, 'pnpm-workspace.yml')) ||
                                   fs.existsSync(path.join(parentDir, 'lerna.json'));
        if (hasWorkspaceConfig) {
          dir = parentDir;
        } else {
          break;
        }
      }
    }
  }

  // If no lockfile found, detect from the project root directory
  if (!detectedManager) {
    detectedManager = registry.detectFromDirectory(projectRoot);
  }

  // For JavaScript projects, check for corepack config
  if (detectedManager && detectedManager.ecosystem === 'javascript') {
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
