import { spawn } from 'child_process';
import { detectPackageManager, shouldRunAtWorkspaceRoot } from './detector';
import { synchronizeDependencies } from './dependency-synchronizer';
import { mapCommand } from './command-mapper';
import { setDefaultPackageManager, setGlobalPackageManager, getGlobalPackageManager } from './config';
import { SKIP_SYNC_COMMANDS, GLOBAL_SUPPORT_COMMANDS } from './command-constants';

export class XPM {
  private readonly version = '0.0.4';
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
  set-config           Set configuration
  [script]             Run package.json script

Flags: --dry-run, --version/-v, --help/-h, -g/--global

Config:
  xpm set-config default-package-manager <npm|yarn|pnpm|bun>
  xpm set-config global-package-manager <npm|yarn|pnpm|bun>

Global installs:
  xpm install -g <package>  # Uses configured global package manager (default: npm)

Detects: npm/yarn/pnpm/bun`);
  }

  run(): void {
    this.parseFlags();

    // Handle set-config command
    const [command, ...args] = this.args;
    if (command === 'set-config') {
      if (args[0] === 'default-package-manager' && args[1]) {
        try {
          setDefaultPackageManager(args[1]);
          process.exit(0);
        } catch (error) {
          console.error(error instanceof Error ? error.message : error);
          process.exit(1);
        }
      } else if (args[0] === 'global-package-manager' && args[1]) {
        try {
          setGlobalPackageManager(args[1]);
          process.exit(0);
        } catch (error) {
          console.error(error instanceof Error ? error.message : error);
          process.exit(1);
        }
      } else {
        console.error('Usage: xpm set-config <default-package-manager|global-package-manager> <npm|yarn|pnpm|bun>');
        process.exit(1);
      }
    }

    // Check for global flag with install/uninstall commands
    const hasGlobalFlag = this.args.includes('-g') || this.args.includes('--global');
    
    if (hasGlobalFlag && command && GLOBAL_SUPPORT_COMMANDS.includes(command as any)) {
      // TODO(yarn-global): Yarn differs for global installs.
      // - Yarn v1 uses: `yarn global <subcmd> ...` (no -g flag)
      // - Yarn v2+ removed persistent global installs; prefer error + guidance or fallback
      // Consider: detect Yarn major via `yarn -v` and special-case here.
      // Handle global installs/uninstalls
      const globalPackageManager = getGlobalPackageManager();
      const filteredArgs = this.args.filter(arg => arg !== '-g' && arg !== '--global');
      
      // Map the command for the global package manager (skip the command itself from args)
      const argsWithoutCommand = filteredArgs.slice(1);
      const mapped = mapCommand(command, argsWithoutCommand, globalPackageManager, undefined);
      
      // Add global flag to the mapped args
      const finalArgs = [mapped.command, '-g', ...mapped.args];
      
      if (this.dryRun) {
        console.log(`[dry-run] Would execute: ${globalPackageManager} ${finalArgs.join(' ')}`);
        return;
      }
      
      console.log(`Using global package manager: ${globalPackageManager}`);
      this.executeCommand(globalPackageManager, finalArgs, process.cwd());
      return;
    }

    try {
      const { packageManager, projectRoot, isWorkspace, workspaceRoot } = detectPackageManager();

      // Auto-sync dependencies unless it's an install-like command or no command
      if (command && !SKIP_SYNC_COMMANDS.includes(command as any)) {
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
      const executionDir = runAtRoot && workspaceRoot ? workspaceRoot : 
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
