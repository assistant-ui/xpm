import { PackageManager } from './package-manager-config';
import { hasScript } from './package-json';
import { INSTALL_COMMANDS, UNINSTALL_COMMANDS, UPDATE_COMMANDS, NPM_BUILTIN_COMMANDS } from './command-constants';

// Helper to create mappings for all aliases
function createMappings(aliases: readonly string[], mappings: Partial<Record<PackageManager, [string, ...string[]]>>) {
  const result: Record<string, Partial<Record<PackageManager, [string, ...string[]]>>> = {};
  for (const alias of aliases) {
    result[alias] = mappings;
  }
  return result;
}

// Command mappings - what differs between package managers
const installMappings = createMappings(
  INSTALL_COMMANDS,
  { yarn: ['add'], pnpm: ['add'], bun: ['add'] }
);

const uninstallMappings = createMappings(
  UNINSTALL_COMMANDS,
  { yarn: ['remove'], pnpm: ['remove'], bun: ['remove'] }
);

const updateMappings = createMappings(
  UPDATE_COMMANDS,
  { yarn: ['update'], bun: ['update'] }
);

const commandMappings: Record<string, Partial<Record<PackageManager, [string, ...string[]]>>> = {
  ...installMappings,
  ...uninstallMappings,
  ...updateMappings,
  // Execute commands  
  'exec': { bun: ["run"] },
};


export function mapCommand(command: string, args: string[], packageManager: PackageManager, projectRoot?: string): { command: string; args: string[] } {
  // Special case: install without args always uses 'install'
  if (INSTALL_COMMANDS.includes(command as any) && args.length === 0) {
    return { command: 'install', args: [] };
  }
  
  // Only map dev flags for install/add commands
  const isInstallCommand = INSTALL_COMMANDS.includes(command as any);
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
  if (packageManager === 'npm' && !NPM_BUILTIN_COMMANDS.has(command) && projectRoot && hasScript(command, projectRoot)) {
    return { command: 'run', args: [command, ...args] };
  }
  
  return { command, args };
}