export { XPM } from './xpm';
export { detectPackageManager } from './detector';
export { synchronizeDependencies, checkDependencies } from './dependency-synchronizer';
export { PACKAGE_MANAGERS, getConfig } from './package-manager-config';
export { readCache, writeCache, hashFile } from './lockfile-hash-cache';
export type { PackageManager } from './package-manager-config';
export type { CacheData } from './lockfile-hash-cache';
export type { SyncOptions } from './dependency-synchronizer';