export interface PackageFile {
  name: string;
  parse(content: string): any;
  stringify(data: any): string;
}

export interface LockFile {
  names: string[];
}

export interface CommandMapping {
  install: string;
  installDev?: string;
  add: string;
  remove: string;
  update: string;
  list?: string;
  outdated?: string;
  run?: string;
  exec?: string;
  ci?: string;
  globalFlag?: string;
}

export interface PackageManagerConfig {
  name: string;
  ecosystem: 'javascript' | 'python' | 'rust' | 'ruby' | 'php';
  packageFile: PackageFile;
  lockFile: LockFile;
  commands: CommandMapping;
  installDir: string;
  detectFiles?: string[];
  workspaceSupport?: boolean;
  workspaceConfigFiles?: string[];
}

export abstract class BasePackageManager {
  protected config: PackageManagerConfig;

  constructor(config: PackageManagerConfig) {
    this.config = config;
  }

  get name(): string {
    return this.config.name;
  }

  get ecosystem(): string {
    return this.config.ecosystem;
  }

  get lockFileNames(): string[] {
    return this.config.lockFile.names;
  }

  get packageFileName(): string {
    return this.config.packageFile.name;
  }

  get installDirectory(): string {
    return this.config.installDir;
  }

  getInstallCommand(ci: boolean = false): string {
    return ci && this.config.commands.ci ? this.config.commands.ci : this.config.commands.install;
  }

  getAddCommand(dev: boolean = false): string {
    if (dev && this.config.commands.installDev) {
      return this.config.commands.installDev;
    }
    return this.config.commands.add;
  }

  getRemoveCommand(): string {
    return this.config.commands.remove;
  }

  getUpdateCommand(): string {
    return this.config.commands.update;
  }

  getRunCommand(): string | undefined {
    return this.config.commands.run;
  }

  getExecCommand(): string | undefined {
    return this.config.commands.exec;
  }

  getGlobalFlag(): string | undefined {
    return this.config.commands.globalFlag;
  }

  supportsWorkspaces(): boolean {
    return this.config.workspaceSupport || false;
  }

  getWorkspaceConfigFiles(): string[] {
    return this.config.workspaceConfigFiles || [];
  }

  abstract mapCommand(command: string, args: string[], options?: any): { command: string; args: string[] };
  abstract detectVersion(cwd: string): string | undefined;
}