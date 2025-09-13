import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { PackageManager, getPMConfig } from './package-manager-config';
import { findExistingLockfile } from './detector';
import { readCache, writeCache, hashFile } from './lockfile-hash-cache';

export interface SyncOptions {
  packageManager: PackageManager;
  projectRoot: string;
  workspaceRoot?: string;
  dryRun?: boolean;
  ciMode?: boolean;
  force?: boolean;
}

function needsInstall(packageManager: PackageManager, projectRoot: string, workspaceRoot?: string): boolean {
  const checkRoot = workspaceRoot || projectRoot;
  const lockfilePath = findExistingLockfile(packageManager, checkRoot);
  const hasNodeModules = fs.existsSync(path.join(checkRoot, 'node_modules'));

  if (!lockfilePath) return !hasNodeModules;

  const currentHash = hashFile(lockfilePath);
  const cache = readCache(checkRoot);
  const hasLockfileChanged = cache.lockfileHash !== currentHash;

  return hasLockfileChanged || !hasNodeModules;
}

export function synchronizeDependencies(options: SyncOptions): void {
  const { packageManager, projectRoot, workspaceRoot, dryRun = false, ciMode = false, force = false } = options;
  const executionRoot = workspaceRoot || projectRoot;
  
  if (!force && !needsInstall(packageManager, projectRoot, workspaceRoot) && !ciMode) return;
  
  const config = getPMConfig(packageManager);
  const command = `${packageManager} ${ciMode ? config.ciCommand : config.installCommand}`;
  
  if (dryRun) {
    console.log(`[dry-run] Would execute: ${command} (in ${executionRoot})`);
    return;
  }
  
  if (!force) {
    console.log(`Synchronizing dependencies with ${packageManager}${ciMode ? ' (CI mode)' : ''}...`);
  }
  
  try {
    const installCmd = ciMode ? config.ciCommand : config.installCommand;
    const args = installCmd.split(' ');
    const result = spawnSync(packageManager, args, { stdio: 'inherit', encoding: 'utf8', cwd: executionRoot });
    
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

export function checkDependencies(packageManager: PackageManager, projectRoot: string, workspaceRoot?: string): boolean {
  return needsInstall(packageManager, projectRoot, workspaceRoot);
}
