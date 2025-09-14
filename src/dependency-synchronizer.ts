import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { BasePackageManager } from './base-package-manager';
import { findExistingLockfile } from './detector';
import { readCache, writeCache, hashFile } from './lockfile-hash-cache';

export interface SyncOptions {
  packageManager: BasePackageManager;
  projectRoot: string;
  workspaceRoot?: string;
  dryRun?: boolean;
  ciMode?: boolean;
  force?: boolean;
}

function needsInstall(packageManager: BasePackageManager, projectRoot: string, workspaceRoot?: string): boolean {
  const checkRoot = workspaceRoot || projectRoot;
  const lockfilePath = findExistingLockfile(packageManager, checkRoot);
  const installDir = packageManager.installDirectory;
  const hasInstallDir = fs.existsSync(path.join(checkRoot, installDir));

  if (!lockfilePath) return !hasInstallDir;

  const currentHash = hashFile(lockfilePath);
  const cache = readCache(checkRoot);
  const hasLockfileChanged = cache.lockfileHash !== currentHash;

  return hasLockfileChanged || !hasInstallDir;
}

export function synchronizeDependencies(options: SyncOptions): void {
  const { packageManager, projectRoot, workspaceRoot, dryRun = false, ciMode = false, force = false } = options;
  const executionRoot = workspaceRoot || projectRoot;

  if (!force && !needsInstall(packageManager, projectRoot, workspaceRoot) && !ciMode) return;

  const installCmd = packageManager.getInstallCommand(ciMode);
  const command = `${packageManager.name} ${installCmd}`;

  if (dryRun) {
    console.log(`[dry-run] Would execute: ${command} (in ${executionRoot})`);
    return;
  }

  if (!force) {
    console.log(`Synchronizing dependencies with ${packageManager.name}${ciMode ? ' (CI mode)' : ''}...`);
  }

  try {
    const args = installCmd.split(' ');
    const result = spawnSync(packageManager.name, args, { stdio: 'inherit', encoding: 'utf8', cwd: executionRoot });

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`Command failed with exit code ${result.status}`);
    }

    const lockfilePath = findExistingLockfile(packageManager, executionRoot);
    if (!lockfilePath) return;
    writeCache(executionRoot, {
      lockfileHash: hashFile(lockfilePath) || undefined,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to install dependencies: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

export function checkDependencies(packageManager: BasePackageManager, projectRoot: string, workspaceRoot?: string): boolean {
  return needsInstall(packageManager, projectRoot, workspaceRoot);
}
