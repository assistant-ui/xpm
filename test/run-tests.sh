#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
XPM_CLI="$SCRIPT_DIR/../dist/cli.js"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Check if xpm is built
if [ ! -f "$XPM_CLI" ]; then
    echo -e "${RED}Error: $XPM_CLI not found. Please run 'npm run build' first.${NC}"
    exit 1
fi

# Test function
run_test() {
    local test_name="$1"
    local test_dir="$2"
    local command="$3"
    local expected="$4"
    local subdir="${5:-}"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    local full_dir="$FIXTURES_DIR/$test_dir"
    if [ -n "$subdir" ]; then
        full_dir="$full_dir/$subdir"
    fi

    # Run the command with dry-run (clear config to ensure consistent results)
    local output=$(cd "$full_dir" && XPM_DEFAULT_PM= XPM_GLOBAL_PM= XDG_CONFIG_HOME=/tmp/xpm-test-config-$$ HOME=/tmp/xpm-test-home-$$ node "$XPM_CLI" --dry-run $command 2>&1)

    # Extract the command from dry-run output
    local actual_command=$(echo "$output" | grep -oP '\[dry-run\] Would execute: \K[^(]+' | xargs)

    # Check if output contains expected command
    if echo "$actual_command" | grep -q "$expected"; then
        echo -e "  ${GREEN}✓${NC} $command → $actual_command"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $command"
        echo -e "    Expected: $expected"
        echo -e "    Got:      $actual_command"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Print header
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${MAGENTA}          XPM Package Manager Test Suite${NC}"
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════${NC}"

# JavaScript Package Manager Tests
echo -e "\n${BOLD}${BLUE}Testing JavaScript Package Managers${NC}"

echo -e "\n${CYAN}NPM Detection (js-npm)${NC}"
run_test "NPM" "js-npm" "install" "npm install"
run_test "NPM" "js-npm" "install express" "npm install express"
run_test "NPM" "js-npm" "remove express" "npm uninstall express"
run_test "NPM" "js-npm" "update" "npm update"
run_test "NPM" "js-npm" "test" "npm test"

echo -e "\n${CYAN}Yarn Detection (js-yarn)${NC}"
run_test "Yarn" "js-yarn" "install" "yarn install"
run_test "Yarn" "js-yarn" "install express" "yarn add express"
run_test "Yarn" "js-yarn" "remove express" "yarn remove express"
run_test "Yarn" "js-yarn" "update" "yarn upgrade"
run_test "Yarn" "js-yarn" "test" "yarn test"

echo -e "\n${CYAN}PNPM Detection (js-pnpm)${NC}"
run_test "PNPM" "js-pnpm" "install" "pnpm install"
run_test "PNPM" "js-pnpm" "install express" "pnpm add express"
run_test "PNPM" "js-pnpm" "remove express" "pnpm remove express"
run_test "PNPM" "js-pnpm" "update" "pnpm update"
run_test "PNPM" "js-pnpm" "test" "pnpm test"

echo -e "\n${CYAN}Bun Detection (js-bun)${NC}"
run_test "Bun" "js-bun" "install" "bun install"
run_test "Bun" "js-bun" "install express" "bun add express"
run_test "Bun" "js-bun" "remove express" "bun remove express"
run_test "Bun" "js-bun" "update" "bun update"
run_test "Bun" "js-bun" "test" "bun test"

# Python Package Manager Tests
echo -e "\n${BOLD}${BLUE}Testing Python Package Managers${NC}"

echo -e "\n${CYAN}Pip Detection (py-pip)${NC}"
run_test "Pip" "py-pip" "install" "pip install"
run_test "Pip" "py-pip" "install flask" "pip install flask"
run_test "Pip" "py-pip" "remove flask" "pip uninstall flask"

echo -e "\n${CYAN}Pipenv Detection (py-pipenv)${NC}"
run_test "Pipenv" "py-pipenv" "install" "pipenv install"
run_test "Pipenv" "py-pipenv" "install flask" "pipenv install flask"
run_test "Pipenv" "py-pipenv" "remove flask" "pipenv uninstall flask"

echo -e "\n${CYAN}Poetry Detection (py-poetry)${NC}"
run_test "Poetry" "py-poetry" "install" "poetry install"
run_test "Poetry" "py-poetry" "install flask" "poetry add flask"
run_test "Poetry" "py-poetry" "remove flask" "poetry remove flask"

echo -e "\n${CYAN}UV Detection (py-uv)${NC}"
run_test "UV" "py-uv" "install" "uv sync"
run_test "UV" "py-uv" "install flask" "uv add flask"
run_test "UV" "py-uv" "remove flask" "uv remove flask"

echo -e "\n${CYAN}Conda Detection (py-conda)${NC}"
run_test "Conda" "py-conda" "install" "conda install"
run_test "Conda" "py-conda" "install flask" "conda install flask"
run_test "Conda" "py-conda" "remove flask" "conda remove flask"

# Workspace Tests
echo -e "\n${BOLD}${BLUE}Testing Workspace Configurations${NC}"

echo -e "\n${CYAN}NPM Workspace${NC}"
run_test "NPM Workspace Root" "workspace-npm" "install" "npm install"
run_test "NPM Workspace Package" "workspace-npm" "install express" "npm install express" "packages/app"

echo -e "\n${CYAN}PNPM Workspace${NC}"
run_test "PNPM Workspace Root" "workspace-pnpm" "install" "pnpm install"
run_test "PNPM Workspace Package" "workspace-pnpm" "install express" "pnpm add express" "packages/app"

echo -e "\n${CYAN}Yarn Workspace${NC}"
run_test "Yarn Workspace Root" "workspace-yarn" "install" "yarn install"
run_test "Yarn Workspace Package" "workspace-yarn" "install express" "yarn add express" "packages/app"

# Global Install Tests
echo -e "\n${BOLD}${BLUE}Testing Global Installs${NC}"

echo -e "\n${CYAN}Global NPM${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
output=$(cd "$FIXTURES_DIR/js-npm" && XPM_GLOBAL_PM=npm XPM_DEFAULT_PM= XDG_CONFIG_HOME=/tmp/xpm-test-config-$$ HOME=/tmp/xpm-test-home-$$ node "$XPM_CLI" --dry-run install -g typescript 2>&1)
actual_command=$(echo "$output" | grep -oP '\[dry-run\] Would execute: \K[^(]+' | xargs)
if echo "$actual_command" | grep -q "npm install -g typescript"; then
    echo -e "  ${GREEN}✓${NC} install -g typescript → $actual_command"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "  ${RED}✗${NC} install -g typescript"
    echo -e "    Expected: npm install -g typescript"
    echo -e "    Got:      $actual_command"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -e "\n${CYAN}Global PNPM${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
output=$(cd "$FIXTURES_DIR/js-pnpm" && XPM_GLOBAL_PM=pnpm XPM_DEFAULT_PM= XDG_CONFIG_HOME=/tmp/xpm-test-config-$$ HOME=/tmp/xpm-test-home-$$ node "$XPM_CLI" --dry-run install -g typescript 2>&1)
actual_command=$(echo "$output" | grep -oP '\[dry-run\] Would execute: \K[^(]+' | xargs)
if echo "$actual_command" | grep -q "pnpm add -g typescript"; then
    echo -e "  ${GREEN}✓${NC} install -g typescript → $actual_command"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "  ${RED}✗${NC} install -g typescript"
    echo -e "    Expected: pnpm add -g typescript"
    echo -e "    Got:      $actual_command"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -e "\n${CYAN}Global Yarn${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
output=$(cd "$FIXTURES_DIR/js-yarn" && XPM_GLOBAL_PM=yarn XPM_DEFAULT_PM= XDG_CONFIG_HOME=/tmp/xpm-test-config-$$ HOME=/tmp/xpm-test-home-$$ node "$XPM_CLI" --dry-run install -g typescript 2>&1)
actual_command=$(echo "$output" | grep -oP '\[dry-run\] Would execute: \K[^(]+' | xargs)
if echo "$actual_command" | grep -q "yarn global add typescript"; then
    echo -e "  ${GREEN}✓${NC} install -g typescript → $actual_command"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "  ${RED}✗${NC} install -g typescript"
    echo -e "    Expected: yarn global add typescript"
    echo -e "    Got:      $actual_command"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Summary
echo -e "\n${BOLD}${MAGENTA}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Test Summary:${NC}"
echo -e "  ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed: $FAILED_TESTS${NC}"
echo -e "  Total:  $TOTAL_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${BOLD}${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "\n${BOLD}${RED}Some tests failed!${NC}"
    exit 1
fi