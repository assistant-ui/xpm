#!/bin/bash

# Create test fixtures for all package managers
FIXTURES_DIR="$(dirname "$0")"

# JavaScript Package Managers
echo "Creating JavaScript package manager fixtures..."

# NPM
mkdir -p "$FIXTURES_DIR/js-npm"
cat > "$FIXTURES_DIR/js-npm/package.json" << 'EOF'
{
  "name": "test-npm",
  "version": "1.0.0",
  "scripts": {
    "test": "echo 'npm test'",
    "build": "echo 'npm build'"
  }
}
EOF
touch "$FIXTURES_DIR/js-npm/package-lock.json"

# Yarn
mkdir -p "$FIXTURES_DIR/js-yarn"
cat > "$FIXTURES_DIR/js-yarn/package.json" << 'EOF'
{
  "name": "test-yarn",
  "version": "1.0.0",
  "packageManager": "yarn@3.0.0",
  "scripts": {
    "test": "echo 'yarn test'",
    "build": "echo 'yarn build'"
  }
}
EOF
touch "$FIXTURES_DIR/js-yarn/yarn.lock"

# PNPM
mkdir -p "$FIXTURES_DIR/js-pnpm"
cat > "$FIXTURES_DIR/js-pnpm/package.json" << 'EOF'
{
  "name": "test-pnpm",
  "version": "1.0.0",
  "scripts": {
    "test": "echo 'pnpm test'",
    "build": "echo 'pnpm build'"
  }
}
EOF
touch "$FIXTURES_DIR/js-pnpm/pnpm-lock.yaml"

# Bun
mkdir -p "$FIXTURES_DIR/js-bun"
cat > "$FIXTURES_DIR/js-bun/package.json" << 'EOF'
{
  "name": "test-bun",
  "version": "1.0.0",
  "scripts": {
    "test": "echo 'bun test'",
    "build": "echo 'bun build'"
  }
}
EOF
touch "$FIXTURES_DIR/js-bun/bun.lockb"

# Python Package Managers
echo "Creating Python package manager fixtures..."

# Pip
mkdir -p "$FIXTURES_DIR/py-pip"
cat > "$FIXTURES_DIR/py-pip/requirements.txt" << 'EOF'
flask==2.0.0
requests==2.28.0
EOF

# Pipenv
mkdir -p "$FIXTURES_DIR/py-pipenv"
cat > "$FIXTURES_DIR/py-pipenv/Pipfile" << 'EOF'
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
flask = "==2.0.0"

[dev-packages]
pytest = "*"
EOF
touch "$FIXTURES_DIR/py-pipenv/Pipfile.lock"

# Poetry
mkdir -p "$FIXTURES_DIR/py-poetry"
cat > "$FIXTURES_DIR/py-poetry/pyproject.toml" << 'EOF'
[tool.poetry]
name = "test-poetry"
version = "0.1.0"
description = "Test Poetry project"

[tool.poetry.dependencies]
python = "^3.8"
flask = "^2.0.0"

[tool.poetry.dev-dependencies]
pytest = "^7.0.0"
EOF
touch "$FIXTURES_DIR/py-poetry/poetry.lock"

# UV
mkdir -p "$FIXTURES_DIR/py-uv"
cat > "$FIXTURES_DIR/py-uv/pyproject.toml" << 'EOF'
[project]
name = "test-uv"
version = "0.1.0"
dependencies = [
    "flask>=2.0.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=7.0.0",
]
EOF
touch "$FIXTURES_DIR/py-uv/uv.lock"

# Conda
mkdir -p "$FIXTURES_DIR/py-conda"
cat > "$FIXTURES_DIR/py-conda/environment.yml" << 'EOF'
name: test-conda
dependencies:
  - python=3.9
  - flask=2.0.0
  - pip:
    - requests==2.28.0
EOF

# Workspace configurations
echo "Creating workspace fixtures..."

# NPM Workspace
mkdir -p "$FIXTURES_DIR/workspace-npm/packages/app"
cat > "$FIXTURES_DIR/workspace-npm/package.json" << 'EOF'
{
  "name": "npm-workspace",
  "version": "1.0.0",
  "workspaces": [
    "packages/*"
  ]
}
EOF
cat > "$FIXTURES_DIR/workspace-npm/packages/app/package.json" << 'EOF'
{
  "name": "@workspace/app",
  "version": "1.0.0"
}
EOF
touch "$FIXTURES_DIR/workspace-npm/package-lock.json"

# PNPM Workspace
mkdir -p "$FIXTURES_DIR/workspace-pnpm/packages/app"
cat > "$FIXTURES_DIR/workspace-pnpm/pnpm-workspace.yaml" << 'EOF'
packages:
  - 'packages/*'
EOF
cat > "$FIXTURES_DIR/workspace-pnpm/package.json" << 'EOF'
{
  "name": "pnpm-workspace",
  "version": "1.0.0"
}
EOF
cat > "$FIXTURES_DIR/workspace-pnpm/packages/app/package.json" << 'EOF'
{
  "name": "@workspace/app",
  "version": "1.0.0"
}
EOF
touch "$FIXTURES_DIR/workspace-pnpm/pnpm-lock.yaml"

# Yarn Workspace
mkdir -p "$FIXTURES_DIR/workspace-yarn/packages/app"
cat > "$FIXTURES_DIR/workspace-yarn/package.json" << 'EOF'
{
  "name": "yarn-workspace",
  "version": "1.0.0",
  "workspaces": [
    "packages/*"
  ]
}
EOF
cat > "$FIXTURES_DIR/workspace-yarn/packages/app/package.json" << 'EOF'
{
  "name": "@workspace/app",
  "version": "1.0.0"
}
EOF
touch "$FIXTURES_DIR/workspace-yarn/yarn.lock"

echo "Fixtures created successfully!"