import * as fs from 'fs';
import * as path from 'path';
import { PackageManager, SUPPORTED_PACKAGE_MANAGERS, getPMConfig } from './package-manager-config';
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
  let lockfileManager: PackageManager | null = null;
  dir = packageJsonDir;

  // Search up the directory tree for lockfiles, but stay within Node.js project boundaries
  while (dir !== path.dirname(dir)) {
    // Check for lockfiles in current directory
    for (const mgr of SUPPORTED_PACKAGE_MANAGERS) {
      const lockfile = findExistingLockfile(mgr, dir);
      if (lockfile) {
        lockfileDir = dir;
        lockfileManager = mgr;
        break;
      }
    }

    if (lockfileDir) break;

    // Move up one directory
    const parentDir = path.dirname(dir);

    // Continue searching if parent has package.json (could be workspace root)
    // or if parent's parent has package.json (we might be in packages/ dir)
    if (fs.existsSync(path.join(parentDir, 'package.json')) ||
        (parentDir !== path.dirname(parentDir) &&
         fs.existsSync(path.join(path.dirname(parentDir), 'package.json')))) {
      dir = parentDir;
    } else {
      break;
    }
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

  // Use the lockfile manager if found, otherwise check for lockfiles
  if (!detectedPM) {
    if (lockfileManager) {
      detectedPM = lockfileManager;
    } else {
      for (const manager of SUPPORTED_PACKAGE_MANAGERS) {
        if (findExistingLockfile(manager, detectionRoot)) {
          detectedPM = manager;
          break;
        }
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

export function findExistingLockfile(pm: PackageManager, dir: string): string | undefined {
  const lf = getPMConfig(pm).lockfile;
  const candidates = Array.isArray(lf) ? lf : [lf];
  for (const name of candidates) {
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
