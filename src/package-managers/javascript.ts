import { BasePackageManager, PackageManagerConfig } from '../base-package-manager';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PACKAGE_JSON = {
  name: 'package.json',
  parse: (content: string) => JSON.parse(content),
  stringify: (data: any) => JSON.stringify(data, null, 2)
};

export class NpmPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'npm',
      ecosystem: 'javascript',
      packageFile: PACKAGE_JSON,
      lockFile: { names: ['package-lock.json'] },
      commands: {
        install: 'install',
        add: 'install',
        installDev: 'install --save-dev',
        remove: 'uninstall',
        update: 'update',
        list: 'list',
        outdated: 'outdated',
        run: 'run',
        exec: 'exec',
        ci: 'ci',
        globalFlag: '-g'
      },
      installDir: 'node_modules',
      workspaceSupport: true
    });
  }

  mapCommand(command: string, args: string[], options?: any): { command: string; args: string[] } {
    const builtinCommands = new Set([
      'access', 'adduser', 'audit', 'bin', 'bugs', 'cache', 'ci', 'completion',
      'config', 'dedupe', 'deprecate', 'diff', 'dist-tag', 'docs', 'doctor',
      'edit', 'exec', 'explain', 'explore', 'fund', 'help', 'hook', 'init',
      'install', 'link', 'll', 'login', 'logout', 'ls', 'org', 'outdated',
      'owner', 'pack', 'ping', 'pkg', 'prefix', 'profile', 'prune', 'publish',
      'query', 'rebuild', 'repo', 'restart', 'root', 'run', 'run-script',
      'search', 'set', 'shrinkwrap', 'star', 'stars', 'start', 'stop', 'team',
      'test', 'token', 'uninstall', 'unpublish', 'unstar', 'update', 'version',
      'view', 'whoami'
    ]);

    if (!builtinCommands.has(command) && options?.hasScript) {
      return { command: 'run', args: [command, ...args] };
    }

    // Handle dev dependencies for install command
    if (command === 'install' && options?.dev) {
      return { command: 'install', args: ['--save-dev', ...args] };
    }

    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('npm', ['--version'], { cwd, encoding: 'utf8' });
      return result.stdout?.trim();
    } catch {
      return undefined;
    }
  }
}

export class YarnPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'yarn',
      ecosystem: 'javascript',
      packageFile: PACKAGE_JSON,
      lockFile: { names: ['yarn.lock'] },
      commands: {
        install: 'install',
        add: 'add',
        installDev: 'add --dev',
        remove: 'remove',
        update: 'upgrade',
        list: 'list',
        outdated: 'outdated',
        run: 'run',
        exec: 'exec',
        ci: 'install --frozen-lockfile',
        globalFlag: 'global'
      },
      installDir: 'node_modules',
      workspaceSupport: true
    });
  }

  mapCommand(command: string, args: string[], options?: any): { command: string; args: string[] } {
    // Handle script commands
    if (options?.hasScript && !['install', 'add', 'remove', 'uninstall', 'update', 'upgrade'].includes(command)) {
      return { command, args };
    }

    if (command === 'install' && args.length > 0) {
      // Handle dev dependencies
      if (options?.dev) {
        return { command: 'add', args: ['--dev', ...args] };
      }
      return { command: 'add', args };
    }
    if (command === 'uninstall') {
      return { command: 'remove', args };
    }
    if (command === 'update') {
      return { command: 'upgrade', args };
    }
    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('yarn', ['--version'], { cwd, encoding: 'utf8' });
      return result.stdout?.trim();
    } catch {
      return undefined;
    }
  }
}

export class PnpmPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'pnpm',
      ecosystem: 'javascript',
      packageFile: PACKAGE_JSON,
      lockFile: { names: ['pnpm-lock.yaml'] },
      commands: {
        install: 'install',
        add: 'add',
        installDev: 'add --save-dev',
        remove: 'remove',
        update: 'update',
        list: 'list',
        outdated: 'outdated',
        run: 'run',
        exec: 'exec',
        ci: 'install --frozen-lockfile',
        globalFlag: '-g'
      },
      installDir: 'node_modules',
      workspaceSupport: true,
      workspaceConfigFiles: ['pnpm-workspace.yaml', 'pnpm-workspace.yml']
    });
  }

  mapCommand(command: string, args: string[], options?: any): { command: string; args: string[] } {
    // Handle script commands
    if (options?.hasScript && !['install', 'add', 'remove', 'uninstall', 'update'].includes(command)) {
      return { command, args };
    }

    if (command === 'install' && args.length > 0) {
      // Handle dev dependencies
      if (options?.dev) {
        return { command: 'add', args: ['--save-dev', ...args] };
      }
      return { command: 'add', args };
    }
    if (command === 'uninstall') {
      return { command: 'remove', args };
    }
    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('pnpm', ['--version'], { cwd, encoding: 'utf8' });
      return result.stdout?.trim();
    } catch {
      return undefined;
    }
  }
}

export class BunPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'bun',
      ecosystem: 'javascript',
      packageFile: PACKAGE_JSON,
      lockFile: { names: ['bun.lock', 'bun.lockb'] },
      commands: {
        install: 'install',
        add: 'add',
        installDev: 'add -d',
        remove: 'remove',
        update: 'update',
        list: 'pm ls',
        outdated: 'outdated',
        run: 'run',
        exec: 'run',
        ci: 'install --frozen-lockfile',
        globalFlag: '-g'
      },
      installDir: 'node_modules',
      workspaceSupport: true
    });
  }

  mapCommand(command: string, args: string[], options?: any): { command: string; args: string[] } {
    // Handle script commands - if it's a script in package.json, use 'run' prefix
    // This includes Bun's built-in commands (test, build, update) when they're defined as scripts
    if (options?.hasScript && !['install', 'add', 'remove', 'uninstall', 'exec'].includes(command)) {
      return { command: 'run', args: [command, ...args] };
    }

    if (command === 'install' && args.length > 0) {
      // Handle dev dependencies
      if (options?.dev) {
        return { command: 'add', args: ['-d', ...args] };
      }
      return { command: 'add', args };
    }
    if (command === 'uninstall') {
      return { command: 'remove', args };
    }
    if (command === 'exec') {
      return { command: 'run', args };
    }

    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('bun', ['--version'], { cwd, encoding: 'utf8' });
      return result.stdout?.trim();
    } catch {
      return undefined;
    }
  }
}

const DENO_JSON = {
  name: 'deno.json',
  parse: (content: string) => {
    const jsonWithComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');
    return JSON.parse(jsonWithComments);
  },
  stringify: (data: any) => JSON.stringify(data, null, 2)
};

export class DenoPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'deno',
      ecosystem: 'javascript',
      packageFile: DENO_JSON,
      lockFile: { names: ['deno.lock'] },
      commands: {
        install: 'install',
        add: 'add',
        installDev: 'add --dev',
        remove: 'remove',
        update: 'update',
        list: 'info',
        outdated: 'outdated',
        run: 'task',
        exec: 'run',
        ci: 'install',
        globalFlag: '--global'
      },
      installDir: 'node_modules',
      detectFiles: ['deno.json', 'deno.jsonc'],
      workspaceSupport: true,
      workspaceConfigFiles: ['deno.json', 'deno.jsonc']
    });
  }

  mapCommand(command: string, args: string[], options?: any): { command: string; args: string[] } {
    // Handle script commands - Deno uses 'task' for scripts
    if (options?.hasScript && !['install', 'add', 'remove', 'uninstall', 'update', 'exec'].includes(command)) {
      return { command: 'task', args: [command, ...args] };
    }

    if (command === 'install' && args.length > 0) {
      // Handle dev dependencies
      if (options?.dev) {
        return { command: 'add', args: ['--dev', ...args] };
      }
      return { command: 'add', args };
    }
    if (command === 'uninstall') {
      return { command: 'remove', args };
    }
    if (command === 'run' && args.length > 0) {
      return { command: 'task', args };
    }
    if (command === 'exec') {
      return { command: 'run', args };
    }

    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('deno', ['--version'], { cwd, encoding: 'utf8' });
      const output = result.stdout?.trim();
      if (output) {
        const match = output.match(/deno ([\d.]+)/i);
        return match ? match[1] : undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}