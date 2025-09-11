// All install command aliases (from npm documentation)
export const INSTALL_COMMANDS = [
  'install',
  'add',
  'i',
  'in',
  'ins',
  'inst',
  'insta',
  'instal',
  'isnt',
  'isnta',
  'isntal',
  'isntall'
] as const;

// All uninstall/remove command aliases (from npm documentation)
export const UNINSTALL_COMMANDS = [
  'uninstall',
  'unlink',
  'remove',
  'rm',
  'r',
  'un'
] as const;

// All update command aliases (from npm documentation)
export const UPDATE_COMMANDS = [
  'update',
  'up',
  'upgrade',
  'udpate'
] as const;

// Combined list for commands that should skip auto-sync
export const SKIP_SYNC_COMMANDS = [
  ...INSTALL_COMMANDS,
  ...UNINSTALL_COMMANDS,
  ...UPDATE_COMMANDS
] as const;

// Commands that support global flag (from npm documentation)
export const GLOBAL_SUPPORT_COMMANDS = [
  ...INSTALL_COMMANDS,
  ...UNINSTALL_COMMANDS,
  ...UPDATE_COMMANDS,
  'list',
  'ls',
  'll',
  'outdated',
  'bin',
  'root',
  'rebuild'
] as const;

// Commands that should run at workspace root when no args provided
export const WORKSPACE_ROOT_COMMANDS = new Set([
  ...INSTALL_COMMANDS,  // All install aliases
  ...UPDATE_COMMANDS,    // All update aliases
  'audit',
  'outdated'
]);

// Known npm commands that shouldn't be treated as scripts
export const NPM_BUILTIN_COMMANDS = new Set([
  'access', 'adduser', 'audit', 'bin', 'bugs', 'cache', 'ci', 'completion',
  'config', 'dedupe', 'deprecate', 'diff', 'dist-tag', 'docs', 'doctor',
  'edit', 'exec', 'explain', 'explore', 'fund', 'help', 'hook', 'init',
  'install-ci-test', 'install-test', 'link', 'll', 'login',
  'logout', 'ls', 'org', 'outdated', 'owner', 'pack', 'ping', 'pkg',
  'prefix', 'profile', 'prune', 'publish', 'query', 'rebuild', 'repo',
  'restart', 'root', 'run', 'run-script', 'search', 'set', 'shrinkwrap',
  'star', 'stars', 'start', 'stop', 'team', 'test', 'token',
  'unpublish', 'unstar', 'version', 'view', 'whoami',
  // Add all our command aliases
  ...INSTALL_COMMANDS,
  ...UNINSTALL_COMMANDS,
  ...UPDATE_COMMANDS
]);

export type InstallCommand = typeof INSTALL_COMMANDS[number];
export type UninstallCommand = typeof UNINSTALL_COMMANDS[number];
export type GlobalSupportCommand = typeof GLOBAL_SUPPORT_COMMANDS[number];