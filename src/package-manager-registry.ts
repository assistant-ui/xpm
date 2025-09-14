import { BasePackageManager } from './base-package-manager';
import {
  NpmPackageManager,
  YarnPackageManager,
  PnpmPackageManager,
  BunPackageManager
} from './package-managers/javascript';
import {
  PipPackageManager,
  PipenvPackageManager,
  PoetryPackageManager,
  UvPackageManager,
  CondaPackageManager
} from './package-managers/python';
import * as fs from 'fs';
import * as path from 'path';

export type Ecosystem = 'javascript' | 'python' | 'rust' | 'ruby' | 'php';
export type PackageManagerName =
  | 'npm' | 'yarn' | 'pnpm' | 'bun'
  | 'pip' | 'pipenv' | 'poetry' | 'uv' | 'conda';

export class PackageManagerRegistry {
  private managers: Map<string, BasePackageManager> = new Map();
  private ecosystemManagers: Map<Ecosystem, BasePackageManager[]> = new Map();

  constructor() {
    this.registerDefaultManagers();
  }

  private registerDefaultManagers(): void {
    // JavaScript package managers
    this.register(new NpmPackageManager());
    this.register(new YarnPackageManager());
    this.register(new PnpmPackageManager());
    this.register(new BunPackageManager());

    // Python package managers
    this.register(new PipPackageManager());
    this.register(new PipenvPackageManager());
    this.register(new PoetryPackageManager());
    this.register(new UvPackageManager());
    this.register(new CondaPackageManager());
  }

  register(manager: BasePackageManager): void {
    this.managers.set(manager.name, manager);

    const ecosystem = manager.ecosystem as Ecosystem;
    if (!this.ecosystemManagers.has(ecosystem)) {
      this.ecosystemManagers.set(ecosystem, []);
    }
    this.ecosystemManagers.get(ecosystem)!.push(manager);
  }

  get(name: string): BasePackageManager | undefined {
    return this.managers.get(name);
  }

  getByEcosystem(ecosystem: Ecosystem): BasePackageManager[] {
    return this.ecosystemManagers.get(ecosystem) || [];
  }

  getAllManagers(): BasePackageManager[] {
    return Array.from(this.managers.values());
  }

  detectFromDirectory(dir: string): BasePackageManager | undefined {
    // First, try to detect ecosystem
    const ecosystem = this.detectEcosystem(dir);
    if (!ecosystem) return undefined;

    const managers = this.getByEcosystem(ecosystem);

    // Check for lock files first (most specific)
    for (const manager of managers) {
      for (const lockFileName of manager.lockFileNames) {
        if (fs.existsSync(path.join(dir, lockFileName))) {
          return manager;
        }
      }
    }

    // Check for package files
    for (const manager of managers) {
      if (fs.existsSync(path.join(dir, manager.packageFileName))) {
        return manager;
      }
    }

    // Check for detect files (if specified)
    for (const manager of managers) {
      const config = (manager as any).config;
      if (config.detectFiles) {
        for (const detectFile of config.detectFiles) {
          if (fs.existsSync(path.join(dir, detectFile))) {
            return manager;
          }
        }
      }
    }

    return undefined;
  }

  private detectEcosystem(dir: string): Ecosystem | undefined {
    // JavaScript ecosystem detection
    if (fs.existsSync(path.join(dir, 'package.json')) ||
        fs.existsSync(path.join(dir, 'node_modules'))) {
      return 'javascript';
    }

    // Python ecosystem detection
    const pythonFiles = [
      'requirements.txt', 'setup.py', 'setup.cfg',
      'pyproject.toml', 'Pipfile', 'environment.yml',
      'environment.yaml', 'conda.yaml', '.python-version'
    ];

    for (const file of pythonFiles) {
      if (fs.existsSync(path.join(dir, file))) {
        return 'python';
      }
    }

    // Check for Python-specific directories
    if (fs.existsSync(path.join(dir, '__pycache__')) ||
        fs.existsSync(path.join(dir, '.venv')) ||
        fs.existsSync(path.join(dir, 'venv'))) {
      return 'python';
    }

    return undefined;
  }

  findProjectRoot(startDir: string, ecosystem?: Ecosystem): string | undefined {
    let dir = startDir;

    while (dir !== path.dirname(dir)) {
      if (ecosystem) {
        const managers = this.getByEcosystem(ecosystem);
        for (const manager of managers) {
          if (fs.existsSync(path.join(dir, manager.packageFileName))) {
            return dir;
          }
        }
      } else {
        // Try to detect any project
        if (this.detectEcosystem(dir)) {
          return dir;
        }
      }

      dir = path.dirname(dir);
    }

    return undefined;
  }
}

export const registry = new PackageManagerRegistry();