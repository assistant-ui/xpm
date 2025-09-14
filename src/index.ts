export { XPM } from './xpm';
export { detectPackageManager } from './detector';
export { synchronizeDependencies, checkDependencies } from './dependency-synchronizer';
export { registry } from './package-manager-registry';
export { BasePackageManager } from './base-package-manager';
export { readCache, writeCache, hashFile } from './lockfile-hash-cache';
export type { PackageManagerName } from './package-manager-registry';
export type { CacheData } from './lockfile-hash-cache';
export type { SyncOptions } from './dependency-synchronizer';
