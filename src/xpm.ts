import { spawn } from 'child_process';
import { detectPackageManager, shouldRunAtWorkspaceRoot } from './detector';
import { synchronizeDependencies } from './dependency-synchronizer';
import { mapCommand } from './command-mapper';

const skipInstallCommands = ['install', 'i', 'add', 'remove', 'uninstall', 'update', 'upgrade'];

export class XPM {
  private readonly version = '1.0.0';
  private args: string[];
  private dryRun = false;

  constructor(args: string[]) {
    this.args = args;
  }
  
  private executeCommand(packageManager: string, args: string[], cwd: string): void {
    const fullCommand = `${packageManager} ${args.join(' ')}`;
    
    if (this.dryRun) {
      console.log(`[dry-run] Would execute: ${fullCommand} (in ${cwd})`);
      return;
    }
    
    const child = spawn(packageManager, args, { stdio: 'inherit', shell: false, cwd });
    child.on('exit', (code) => process.exit(code || 0));
    child.on('error', (error) => {
      console.error(`Failed to execute ${packageManager}: ${error.message}`);
      process.exit(1);
    });
  }

  private parseFlags(): void {
    const flags = { '--version': '-v', '--help': '-h' };
    for (const [full, short] of Object.entries(flags)) {
      if (this.args.includes(full) || this.args.includes(short)) {
        full === '--version' ? console.log(`xpm version ${this.version}`) : this.showHelp();
        process.exit(0);
      }
    }
    if (this.args.includes('--dry-run')) {
      this.dryRun = true;
      this.args = this.args.filter(arg => arg !== '--dry-run');
    }
  }

  private showHelp(): void {
    console.log(`xpm v${this.version}

Usage: xpm [command] [...args]

Commands:
  install/i/add [pkg]  Install package(s)
  remove/rm/uninstall  Remove package
  upgrade              Update packages
  [script]             Run package.json script

Flags: --dry-run, --version/-v, --help/-h

Detects: npm/yarn/pnpm/bun`);
  }

  run(): void {
    this.parseFlags();

    try {
      const { packageManager, projectRoot, isWorkspace, workspaceRoot } = detectPackageManager();
      const [command, ...args] = this.args;

      // Auto-sync dependencies unless it's an install-like command or no command
      if (command && !skipInstallCommands.includes(command)) {
        synchronizeDependencies({ packageManager, projectRoot, workspaceRoot, dryRun: this.dryRun });
      }

      // No command = install
      if (!command) {
        return synchronizeDependencies({ 
          packageManager, projectRoot, workspaceRoot, 
          dryRun: this.dryRun, force: true 
        });
      }

      // Determine execution directory
      const runAtRoot = isWorkspace && shouldRunAtWorkspaceRoot(command, args);
      const executionDir = runAtRoot ? workspaceRoot! : 
                          packageManager === 'npm' ? projectRoot : 
                          process.cwd();

      // Map command and execute
      const mapped = mapCommand(command, args, packageManager, projectRoot);
      const finalArgs = [mapped.command, ...mapped.args];
      
      if (this.dryRun) {
        return console.log(`[dry-run] Would execute: ${packageManager} ${finalArgs.join(' ')} (in ${executionDir})`);
      }
      
      if (isWorkspace && runAtRoot) console.log(`Running at workspace root: ${workspaceRoot}`);
      this.executeCommand(packageManager, finalArgs, executionDir);

    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  }
}