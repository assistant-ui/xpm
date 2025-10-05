# xpm - Universal Package Manager Wrapper

Working across multiple projects with different package managers?

You can use `xpm` instead of `npm`/`yarn`/`pnpm`/`bun`/`deno` (and even `pip`/`poetry`/`uv`).

Think of `xpm` as your universal translator for package managers. When you run `xpm`, it figures out which package manager your project uses, ensures your dependencies are up-to-date, and runs the appropriate command. It's like having muscle memory that works everywhere.

For example, when you run `xpm dev` in a project:

- `xpm` detects the package manager
- it auto-installs dependencies if necessary (compares lockfile hash)
- runs `npm run dev` / `yarn dev` / `pnpm dev` / `bun dev` / `deno task dev`


## Install

```bash
npm install -g @assistant-ui/xpm
```

## Features

- 🔍 **Auto-detects** your package manager from lockfiles or package.json
- ⚡ **Dependency sync** - auto-installs dependencies when lockfile changes
- 🎯 **Unified commands** - identical commands across all package managers
- 📦 **Workspace aware** - correctly handles monorepo operations
- 🏃 **Runs from anywhere** - works in project subdirectories
- 🌍 **Multi-language** - supports JavaScript and Python ecosystems


## Usage

```bash
xpm               # Install dependencies
xpm add react     # Add a package
xpm dev           # Run a script

xpm add -g turbo  # Installs global dependency

xpx prettier      # Download and run from the registry
```

## Configuration

xpm defaults to npm for global installs. Configure this with a config file at `~/.config/xpm/config.json` or `~/.xpmrc`.

### Default Package Manager

Set the default package manager for new projects (when no lockfile or package.json `packageManager` field is found):

```bash
xpm set-config default-package-manager <npm|yarn|pnpm|bun|deno>
```

Environment variable (takes precedence):
```bash
export XPM_DEFAULT_PM=<npm|yarn|pnpm|bun|deno>
```

### Global Package Manager

Set which package manager to use for global installs (`-g` flag):

```bash
xpm set-config global-package-manager <npm|yarn|pnpm|bun|deno>
```

Environment variable (takes precedence):
```bash
export XPM_GLOBAL_PM=<npm|yarn|pnpm|bun|deno>
```

Default: `npm`

### Configuration Priority

1. Environment variables (`XPM_DEFAULT_PM`, `XPM_GLOBAL_PM`)
2. Config file (`~/.config/xpm/config.json` or `~/.xpmrc`)
3. Default fallback (`npm`)

## Python Support

While xpm is primarily designed for JavaScript projects, it also supports Python package managers for a unified development experience across languages.

### Supported Python Package Managers

- **pip** - Detects `requirements.txt`
- **pipenv** - Detects `Pipfile` and `Pipfile.lock`
- **poetry** - Detects `pyproject.toml` and `poetry.lock`
- **uv** - Detects `uv.lock`
- **conda** - Detects `environment.yml`

### Python Usage Examples

```bash
# In a Python project
xpm install          # Runs pip/pipenv/poetry install
xpm install flask    # Adds flask package
xpm remove flask     # Removes flask package

# Poetry project
xpm install --dev pytest  # Adds pytest as dev dependency

# UV project
xpm sync            # Syncs dependencies
xpm update          # Updates lockfile
```

### Detection Priority

1. **Lockfiles** - Most specific (e.g., `poetry.lock` → Poetry)
2. **Package files** - Project configuration (e.g., `Pipfile` → Pipenv)
3. **Fallback** - Uses pip if `requirements.txt` exists

**Note:** Python global installs (`-g`) are not supported.

## Future Work

### TODO
- [ ] **pnpm patch support** - Support for pnpm patch files and patch packages
- [ ] **Auto-install package managers** - Prompt user to install missing package managers (for all supported package managers)

## License

MIT
