# xpm - Universal Package Manager Wrapper

Working across multiple projects with different package managers? 

You can use `xpm` instead of `npm`/`yarn`/`pnpm`/`bun`.

Think of `xpm` as your universal translator for package managers. When you run `xpm`, it figures out which package manager your project uses, ensures your dependencies are up-to-date, and runs the appropriate command. It's like having muscle memory that works everywhere.

For example, when you run `xpm dev` in a project:

- `xpm` detects the package manager
- it auto-installs dependencies if necessary (compares lockfile hash)
- runs `npm run dev` / `yarn dev` / `pnpm dev` / `bun dev`


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


## Usage

```bash
xpm               # Install dependencies
xpm add react     # Add a package
xpm dev           # Run a script

xpm add -g turbo  # Installs global dependency

xpx prettier      # Download and run from the registry
```

## Configuration

Set the default package manager for new projects:

```bash
xpm set-config default-package-manager <npm|yarn|pnpm|bun>
```

The default is used when no lockfile or package.json `packageManager` field is found.

You can also set it via environment variable:
```bash
export XPM_DEFAULT_PM=<npm|yarn|pnpm|bun>
```

Set the package manager for -g commands:

```bash
xpm set-config global-package-manager <npm|yarn|pnpm|bun>
```

You can also set it via environment variable:
```bash
export XPM_GLOBAL_PM=<npm|yarn|pnpm|bun>
```


## License

MIT