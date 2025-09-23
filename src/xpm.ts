import { spawn } from 'child_process';
import { detectPackageManager, shouldRunAtWorkspaceRoot } from './detector';
import { synchronizeDependencies } from './dependency-synchronizer';
import { mapCommand } from './command-mapper';
import { setDefaultPackageManager, setGlobalPackageManager, getGlobalPackageManager } from './config';
import { registry } from './package-manager-registry';
import { hasScript } from './package-json';
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

    console.log(`\x1b[36m→ ${fullCommand}\x1b[0m`);
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
    const supportedManagers = registry.getAllManagers().map(m => m.name).join('/');
    const jsManagers = registry.getByEcosystem('javascript').map(m => m.name).join('/');
    const pyManagers = registry.getByEcosystem('python').map(m => m.name).join('/');

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
  xpm set-config default-package-manager <${supportedManagers}>
  xpm set-config global-package-manager <${jsManagers}>

Global installs:
  xpm install -g <package>  # Uses configured global package manager (default: npm)

Supported package managers:
  JavaScript: ${jsManagers}
  Python: ${pyManagers}`);
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
      // Handle global installs/uninstalls
      const globalPMName = getGlobalPackageManager();
      const globalPM = registry.get(globalPMName);

      if (!globalPM) {
        console.error(`Global package manager '${globalPMName}' not found`);
        process.exit(1);
      }

      // Only JavaScript package managers support global installs currently
      if (globalPM.ecosystem !== 'javascript') {
        console.error(`Global installs are only supported for JavaScript package managers`);
        process.exit(1);
      }

      const filteredArgs = this.args.filter(arg => arg !== '-g' && arg !== '--global');
      const argsWithoutCommand = filteredArgs.slice(1);
      const mapped = mapCommand(command, argsWithoutCommand, globalPM, undefined);

      // Handle special case for Yarn global commands
      let finalArgs: string[];
      if (globalPM.name === 'yarn') {
        // Yarn v1 uses: yarn global add/remove <package>
        finalArgs = ['global', mapped.command, ...mapped.args];
      } else {
        const globalFlag = globalPM.getGlobalFlag() || '-g';
        finalArgs = [mapped.command, globalFlag, ...mapped.args];
      }

      if (this.dryRun) {
        console.log(`[dry-run] Would execute: ${globalPM.name} ${finalArgs.join(' ')}`);
        return;
      }

      console.log(`\x1b[33mUsing global package manager: ${globalPM.name}\x1b[0m`);
      this.executeCommand(globalPM.name, finalArgs, process.cwd());
      return;
    }

    try {
      const { packageManager, projectRoot, isWorkspace, workspaceRoot } = detectPackageManager();

      // Auto-sync dependencies unless it's an install-like command
      // Always sync if lockfile is missing, even for scripts
      // Only for JavaScript projects currently
      const isScript = command && packageManager.ecosystem === 'javascript' && hasScript(command, projectRoot);
      const shouldAutoSync = command &&
        !SKIP_SYNC_COMMANDS.includes(command as any) &&
        packageManager.ecosystem === 'javascript' &&
        (!isScript || require('./dependency-synchronizer').checkDependencies(packageManager, projectRoot, workspaceRoot));

      if (shouldAutoSync) {
        synchronizeDependencies({ packageManager, projectRoot, workspaceRoot, dryRun: this.dryRun });
      }

      // No command = install
      if (!command) {
        if (packageManager.ecosystem === 'javascript') {
          return synchronizeDependencies({
            packageManager, projectRoot, workspaceRoot,
            dryRun: this.dryRun, force: true
          });
        } else {
          // For non-JS ecosystems, run the install command
          const installCmd = packageManager.getInstallCommand();
          const finalArgs = installCmd.split(' ');

          if (this.dryRun) {
            return console.log(`[dry-run] Would execute: ${packageManager.name} ${finalArgs.join(' ')} (in ${projectRoot})`);
          }

          this.executeCommand(packageManager.name, finalArgs, projectRoot);
          return;
        }
      }

      // Determine execution directory
      const runAtRoot = isWorkspace && shouldRunAtWorkspaceRoot(command, args);
      const executionDir = runAtRoot && workspaceRoot ? workspaceRoot :
                          packageManager.name === 'npm' ? projectRoot :
                          process.cwd();

      // Map command and execute
      const mapped = mapCommand(command, args, packageManager, projectRoot);
      const finalArgs = [mapped.command, ...mapped.args];

      if (this.dryRun) {
        return console.log(`[dry-run] Would execute: ${packageManager.name} ${finalArgs.join(' ')} (in ${executionDir})`);
      }

      if (isWorkspace && runAtRoot) console.log(`\x1b[33mRunning at workspace root: ${workspaceRoot}\x1b[0m`);
      this.executeCommand(packageManager.name, finalArgs, executionDir);

    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  }
}
