import { PackageManager } from './package-manager-config';
import { hasScript } from './package-json';

// Simplified command mappings - only what differs between package managers
const commandMappings: Record<string, Partial<Record<PackageManager, [string, ...string[]]>>> = {
  // Install/add commands
  'install': { yarn: ['add'], pnpm: ['add'], bun: ['add'] },
  'i': { yarn: ['add'], pnpm: ['add'], bun: ['add'] },
  
  // Remove commands
  'uninstall': { yarn: ['remove'], pnpm: ['remove'], bun: ['remove'] },
  'rm': { yarn: ['remove'], pnpm: ['remove'], bun: ['remove'] },
  
  // Update commands
  'upgrade': { yarn: ['update'], bun: ['update'] },
  'up': { yarn: ['update'], bun: ['update'] },
  
  // Execute commands  
  'exec': { bun: ["run"] },
};

// Known npm commands that shouldn't be treated as scripts
const npmBuiltinCommands = new Set([
  'access', 'adduser', 'audit', 'bin', 'bugs', 'cache', 'ci', 'completion',
  'config', 'dedupe', 'deprecate', 'diff', 'dist-tag', 'docs', 'doctor',
  'edit', 'exec', 'explain', 'explore', 'fund', 'help', 'hook', 'init',
  'install', 'install-ci-test', 'install-test', 'link', 'll', 'login',
  'logout', 'ls', 'org', 'outdated', 'owner', 'pack', 'ping', 'pkg',
  'prefix', 'profile', 'prune', 'publish', 'query', 'rebuild', 'repo',
  'restart', 'root', 'run', 'run-script', 'search', 'set', 'shrinkwrap',
  'star', 'stars', 'start', 'stop', 'team', 'test', 'token', 'uninstall',
  'unpublish', 'unstar', 'update', 'version', 'view', 'whoami', 'i'
]);

export function mapCommand(command: string, args: string[], packageManager: PackageManager, projectRoot?: string): { command: string; args: string[] } {
  // Special case: install without args always uses 'install'
  if ((command === 'install' || command === 'i') && args.length === 0) {
    return { command: 'install', args: [] };
  }
  
  // Only map dev flags for install/add commands
  const isInstallCommand = ['install', 'i', 'add'].includes(command);
  const mappedArgs = isInstallCommand ? args.map(arg => {
    // Map all dev flags to package manager specific format
    if (arg === '-D' || arg === '--save-dev' || arg === '--dev') {
      if (packageManager === 'bun') return '-d';
      return '-D';
    }
    return arg;
  }) : args;
  
  // Check for command mapping
  const mapping = commandMappings[command]?.[packageManager];
  if (mapping) {
    const [mappedCmd, ...cmdArgs] = mapping;
    return { command: mappedCmd, args: [...cmdArgs, ...mappedArgs] };
  }
  
  // npm needs 'run' prefix for scripts not in built-in commands
  if (packageManager === 'npm' && !npmBuiltinCommands.has(command) && hasScript(command, projectRoot)) {
    return { command: 'run', args: [command, ...args] };
  }
  
  return { command, args };
}