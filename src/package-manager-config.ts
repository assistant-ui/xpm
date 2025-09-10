export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

// Only store what we actually use
type PMConfig = { lockfile: string; installCommand: string; ciCommand: string };

export const PACKAGE_MANAGERS: Record<PackageManager, PMConfig> = {
  npm: { lockfile: 'package-lock.json', installCommand: 'install', ciCommand: 'ci' },
  yarn: { lockfile: 'yarn.lock', installCommand: 'install', ciCommand: 'install --frozen-lockfile' },
  pnpm: { lockfile: 'pnpm-lock.yaml', installCommand: 'install', ciCommand: 'install --frozen-lockfile' },
  bun: { lockfile: 'bun.lockb', installCommand: 'install', ciCommand: 'install --frozen-lockfile' }
};

export const SUPPORTED_PACKAGE_MANAGERS = Object.keys(PACKAGE_MANAGERS) as PackageManager[];
export const getConfig = (pm: PackageManager) => PACKAGE_MANAGERS[pm];