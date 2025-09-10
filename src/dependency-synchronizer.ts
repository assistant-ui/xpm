import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { PackageManager, getConfig } from './package-manager-config';
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
  const lockfilePath = path.join(checkRoot, getConfig(packageManager).lockfile);
  
  if (!fs.existsSync(lockfilePath)) return false;
  
  const currentHash = hashFile(lockfilePath);
  const cache = readCache(checkRoot);
  
  return cache.lockfileHash !== currentHash || 
         !fs.existsSync(path.join(checkRoot, 'node_modules'));
}

export function synchronizeDependencies(options: SyncOptions): void {
  const { packageManager, projectRoot, workspaceRoot, dryRun = false, ciMode = false, force = false } = options;
  const executionRoot = workspaceRoot || projectRoot;
  
  if (!force && !needsInstall(packageManager, projectRoot, workspaceRoot) && !ciMode) return;
  
  const config = getConfig(packageManager);
  const command = `${packageManager} ${ciMode ? config.ciCommand : config.installCommand}`;
  
  if (dryRun) {
    console.log(`[dry-run] Would execute: ${command} (in ${executionRoot})`);
    return;
  }
  
  if (!force) {
    console.log(`Synchronizing dependencies with ${packageManager}${ciMode ? ' (CI mode)' : ''}...`);
  }
  
  try {
    execSync(command, { stdio: 'inherit', encoding: 'utf8', cwd: executionRoot });
    
    const lockfilePath = path.join(executionRoot, getConfig(packageManager).lockfile);
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