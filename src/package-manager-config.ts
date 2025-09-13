export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

type PMConfig = {
  lockfile: string | string[];
  installCommand: string;
  ciCommand: string;
};

export const PACKAGE_MANAGERS: Record<PackageManager, PMConfig> = {
  npm: { lockfile: 'package-lock.json', installCommand: 'install', ciCommand: 'ci' },
  yarn: { lockfile: 'yarn.lock', installCommand: 'install', ciCommand: 'install --frozen-lockfile' },
  pnpm: { lockfile: 'pnpm-lock.yaml', installCommand: 'install', ciCommand: 'install --frozen-lockfile' },
  bun: { lockfile: ['bun.lock', 'bun.lockb'], installCommand: 'install', ciCommand: 'install --frozen-lockfile' }
};

export const SUPPORTED_PACKAGE_MANAGERS = Object.keys(PACKAGE_MANAGERS) as PackageManager[];
export const getPMConfig = (pm: PackageManager) => PACKAGE_MANAGERS[pm];
