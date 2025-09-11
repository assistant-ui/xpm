# xpm - Universal Package Manager Wrapper

`xpm` is built for those who work across multiple projects with different package managers. You can use `xpm` instead of `npm`/`yarn`/`pnpm`/`bun`. `xpm` invokes the right package manager for you. Additonally, it installs package dependencies if you forgot to do it.

For example, when you run `xpm dev` in a project:

- xpm detects the package manager
- auto-installs dependencies if necessary (compares lockfile hash)
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

xpx prettier      # Download and run from the registry
```


## License

MIT