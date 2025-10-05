import { BasePackageManager } from './base-package-manager';
import { hasScript } from './package-json';
import { INSTALL_COMMANDS, UNINSTALL_COMMANDS, UPDATE_COMMANDS } from './command-constants';

// Map standard command aliases to normalized commands
function normalizeCommand(command: string): string {
  if (INSTALL_COMMANDS.includes(command as any)) return 'install';
  if (UNINSTALL_COMMANDS.includes(command as any)) return 'uninstall';
  if (UPDATE_COMMANDS.includes(command as any)) return 'update';
  return command;
}


export function mapCommand(
  command: string,
  args: string[],
  packageManager: BasePackageManager,
  projectRoot?: string
): { command: string; args: string[] } {
  const normalized = normalizeCommand(command);

  // Only handle dev dependencies for install-like commands
  const isInstallCommand = normalized === 'install';
  const hasDevFlag = isInstallCommand && args.some(arg => ['-D', '--save-dev', '--dev'].includes(arg));
  const filteredArgs = isInstallCommand
    ? args.filter(arg => !['-D', '--save-dev', '--dev'].includes(arg))
    : args; // Keep all args for non-install commands

  // Use the package manager's mapCommand method for specific mappings
  const mapped = packageManager.mapCommand(normalized, filteredArgs, {
    dev: hasDevFlag,
    hasScript: projectRoot ? hasScript(command, projectRoot) : false
  });

  return mapped;
}