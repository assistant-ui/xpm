import { BasePackageManager, PackageManagerConfig } from '../base-package-manager';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REQUIREMENTS_TXT = {
  name: 'requirements.txt',
  parse: (content: string) => content.split('\n').filter(line => line.trim() && !line.startsWith('#')),
  stringify: (data: string[]) => data.join('\n')
};

const PYPROJECT_TOML = {
  name: 'pyproject.toml',
  parse: (content: string) => {
    // Simple TOML parsing for now
    return content;
  },
  stringify: (data: any) => data
};

const PIPFILE = {
  name: 'Pipfile',
  parse: (content: string) => {
    // Simple TOML parsing for now
    return content;
  },
  stringify: (data: any) => data
};

export class PipPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'pip',
      ecosystem: 'python',
      packageFile: REQUIREMENTS_TXT,
      lockFile: { names: ['requirements.lock', 'requirements-lock.txt'] },
      commands: {
        install: 'install -r requirements.txt',
        add: 'install',
        remove: 'uninstall',
        update: 'install --upgrade',
        list: 'list',
        outdated: 'list --outdated',
        globalFlag: '--user'
      },
      installDir: 'site-packages',
      detectFiles: ['requirements.txt', 'setup.py']
    });
  }

  mapCommand(command: string, args: string[]): { command: string; args: string[] } {
    if (command === 'add') {
      return { command: 'install', args };
    }
    if (command === 'remove') {
      return { command: 'uninstall', args };
    }
    if (command === 'update') {
      return { command: 'install', args: ['--upgrade', ...args] };
    }
    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('pip', ['--version'], { cwd, encoding: 'utf8' });
      const match = result.stdout?.match(/pip (\S+)/);
      return match?.[1];
    } catch {
      return undefined;
    }
  }
}

export class PipenvPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'pipenv',
      ecosystem: 'python',
      packageFile: PIPFILE,
      lockFile: { names: ['Pipfile.lock'] },
      commands: {
        install: 'install',
        add: 'install',
        installDev: 'install --dev',
        remove: 'uninstall',
        update: 'update',
        list: 'graph',
        outdated: 'check',
        run: 'run',
        exec: 'run',
        ci: 'install --deploy'
      },
      installDir: '.venv',
      detectFiles: ['Pipfile']
    });
  }

  mapCommand(command: string, args: string[]): { command: string; args: string[] } {
    if (command === 'add') {
      return { command: 'install', args };
    }
    if (command === 'remove') {
      return { command: 'uninstall', args };
    }
    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('pipenv', ['--version'], { cwd, encoding: 'utf8' });
      const match = result.stdout?.match(/pipenv, version (\S+)/);
      return match?.[1];
    } catch {
      return undefined;
    }
  }
}

export class PoetryPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'poetry',
      ecosystem: 'python',
      packageFile: PYPROJECT_TOML,
      lockFile: { names: ['poetry.lock'] },
      commands: {
        install: 'install',
        add: 'add',
        installDev: 'add --dev',
        remove: 'remove',
        update: 'update',
        list: 'show',
        outdated: 'show --outdated',
        run: 'run',
        exec: 'run',
        ci: 'install --no-dev'
      },
      installDir: '.venv',
      detectFiles: ['pyproject.toml'],
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
    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('poetry', ['--version'], { cwd, encoding: 'utf8' });
      const match = result.stdout?.match(/Poetry .*version (\S+)/);
      return match?.[1];
    } catch {
      return undefined;
    }
  }
}

export class UvPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'uv',
      ecosystem: 'python',
      packageFile: PYPROJECT_TOML,
      lockFile: { names: ['uv.lock'] },
      commands: {
        install: 'sync',
        add: 'add',
        installDev: 'add --dev',
        remove: 'remove',
        update: 'lock --upgrade',
        list: 'pip list',
        outdated: 'pip list --outdated',
        run: 'run',
        exec: 'run',
        ci: 'sync --frozen'
      },
      installDir: '.venv',
      detectFiles: ['pyproject.toml', 'uv.lock'],
      workspaceSupport: true
    });
  }

  mapCommand(command: string, args: string[]): { command: string; args: string[] } {
    if (command === 'install') {
      if (args.length === 0) {
        return { command: 'sync', args: [] };
      }
      return { command: 'add', args };
    }
    if (command === 'uninstall') {
      return { command: 'remove', args };
    }
    if (command === 'update') {
      return { command: 'lock', args: ['--upgrade', ...args] };
    }
    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('uv', ['--version'], { cwd, encoding: 'utf8' });
      const match = result.stdout?.match(/uv (\S+)/);
      return match?.[1];
    } catch {
      return undefined;
    }
  }
}

export class CondaPackageManager extends BasePackageManager {
  constructor() {
    super({
      name: 'conda',
      ecosystem: 'python',
      packageFile: {
        name: 'environment.yml',
        parse: (content: string) => content,
        stringify: (data: any) => data
      },
      lockFile: { names: ['environment.lock.yml'] },
      commands: {
        install: 'install',
        add: 'install',
        remove: 'remove',
        update: 'update',
        list: 'list',
        outdated: 'search --outdated',
        run: 'run',
        exec: 'exec'
      },
      installDir: 'envs',
      detectFiles: ['environment.yml', 'environment.yaml', 'conda.yaml']
    });
  }

  mapCommand(command: string, args: string[]): { command: string; args: string[] } {
    if (command === 'add') {
      return { command: 'install', args };
    }
    if (command === 'uninstall') {
      return { command: 'remove', args };
    }
    return { command, args };
  }

  detectVersion(cwd: string): string | undefined {
    try {
      const result = spawnSync('conda', ['--version'], { cwd, encoding: 'utf8' });
      const match = result.stdout?.match(/conda (\S+)/);
      return match?.[1];
    } catch {
      return undefined;
    }
  }
}