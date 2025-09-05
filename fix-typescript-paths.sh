#!/bin/bash

# Fix TypeScript Configuration Script - Path References
# This script fixes path references in TypeScript configuration files

# ANSI color codes for formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print a header
function print_header() {
  echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n"
}

# Print a step
function print_step() {
  echo -e "\n${BOLD}${MAGENTA}Step $1: $2${NC}"
}

# Print success
function print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Print warning
function print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Print error
function print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_header "TypeScript Path References Fix"

# Step 1: Fix project-specific tsconfig.json files to use absolute paths
print_step "1" "Fixing project-specific tsconfig.json files"

# Find all project tsconfig.json files
find ./libs ./apps -name "tsconfig.json" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while read tsconfig_file; do
  # Skip node_modules and dist directories
  if [[ "$tsconfig_file" == *"node_modules"* ]] || [[ "$tsconfig_file" == *"dist"* ]]; then
    continue
  fi
  
  # Create backup if it doesn't exist
  if [ ! -f "${tsconfig_file}.bak" ]; then
    cp "$tsconfig_file" "${tsconfig_file}.bak"
  fi
  
  # Get the directory of the tsconfig file
  dir=$(dirname "$tsconfig_file")
  
  # Get the relative path from the current directory to the root
  rel_path=$(realpath --relative-to="$dir" .)
  
  # Create a new tsconfig.json file with proper path references
  cat > "$tsconfig_file" << EOL
{
  "extends": "${rel_path}/tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "${rel_path}/dist/out-tsc",
    "declaration": true,
    "types": ["node", "jest"]
  },
  "files": [],
  "include": ["**/*.ts"],
  "exclude": ["jest.config.ts", "**/*.spec.ts", "**/*.test.ts", "**/*.d.ts"]
}
EOL
  
  print_success "Updated $tsconfig_file with correct path references"
done

# Step 2: Fix jest.config.ts files to use ESM syntax and correct paths
print_step "2" "Fixing jest configuration files"

find ./libs ./apps -name "jest.config.ts" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while read jest_config; do
  # Create a backup if it doesn't exist
  if [ ! -f "${jest_config}.bak" ]; then
    cp "$jest_config" "${jest_config}.bak"
  fi
  
  # Get the directory of the jest config file
  dir=$(dirname "$jest_config")
  
  # Get the relative path from the current directory to the root
  rel_path=$(realpath --relative-to="$dir" .)
  
  # Update the file to use ESM export syntax and correct path
  cat > "$jest_config" << EOL
import { readFileSync } from 'fs';

// Reading the base Jest preset using dynamic import
const { default: jestPreset } = await import('${rel_path}/jest.preset.mjs');

export default {
  ...jestPreset,
  displayName: '$(basename "$dir")',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  coverageDirectory: '${rel_path}/coverage/$(basename "$dir")'
};
EOL
  
  print_success "Updated $jest_config for ESM"
done

# Step 3: Update jest.preset.mjs to ensure it's using ESM syntax
print_step "3" "Fixing jest.preset.mjs"

# Create a backup if it doesn't exist
if [ ! -f "jest.preset.mjs.bak" ] && [ -f "jest.preset.mjs" ]; then
  cp "jest.preset.mjs" "jest.preset.mjs.bak"
fi

# Create or update jest.preset.mjs
cat > "jest.preset.mjs" << 'EOL'
// jest.preset.mjs
const nxPreset = require('@nx/jest/preset').default;

export default {
  ...nxPreset,
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
    }],
  },
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  coverageReporters: ['html', 'lcov', 'text'],
};
EOL

print_success "Updated jest.preset.mjs"

# Step 4: Create tsconfig.spec.json in each project
print_step "4" "Creating tsconfig.spec.json in each project"

find ./libs ./apps -type d -not -path "*/node_modules/*" -not -path "*/dist/*" | while read dir; do
  # Skip node_modules and dist directories
  if [[ "$dir" == *"node_modules"* ]] || [[ "$dir" == *"dist"* ]]; then
    continue
  fi
  
  # Only process directories that have a tsconfig.json
  if [ -f "$dir/tsconfig.json" ]; then
    # Get the relative path from the current directory to the root
    rel_path=$(realpath --relative-to="$dir" .)
    
    # Create tsconfig.spec.json
    cat > "$dir/tsconfig.spec.json" << EOL
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "${rel_path}/dist/out-tsc",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["jest", "node"]
  },
  "include": [
    "jest.config.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
EOL
    
    print_success "Created $dir/tsconfig.spec.json"
  fi
done

print_header "TypeScript Path References Fix Complete"
print_success "The TypeScript path references have been fixed!"
echo
echo "Next steps:"
echo "1. Run 'pnpm ts:check' to verify the TypeScript configuration"
echo "2. If there are still issues, check error messages for specific files"
echo
print_success "Done!"
