import { BasePackageManager } from '../base-package-manager';
import { spawnSync } from 'child_process';
import { getBunScriptMode } from '../config';

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

  mapCommand(command: string, args: string[]): { command: string; args: string[] } {
    if (command === 'install' && args.length > 0) {
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

  mapCommand(command: string, args: string[]): { command: string; args: string[] } {
    if (command === 'install' && args.length > 0) {
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
    if (command === 'install' && args.length > 0) {
      return { command: 'add', args };
    }
    if (command === 'uninstall') {
      return { command: 'remove', args };
    }
    if (command === 'exec') {
      return { command: 'run', args };
    }

    // Generalize: Prefer scripts over builtins when script exists and mode allows
    if (options?.hasScript) {
      const mode = getBunScriptMode();
      if (mode === 'script' || (mode === 'auto' && options.hasScript)) {
        return { command: 'run', args: [command, ...args] };
      }
    }
    // Otherwise, use direct command (builtin if applicable) with mapped args

    const devFlags = ['-D', '--save-dev', '--dev'];
    const mappedArgs = args.map(arg => devFlags.includes(arg) ? '-d' : arg);

    return { command, args: mappedArgs };
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
