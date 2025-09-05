#!/bin/bash

# Fix Nx Configuration for ESM
# This script specifically addresses Nx configuration for ESM projects

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

print_header "Nx Configuration Fix for ESM"

# Step 1: Fix nx.json
print_step "1" "Updating nx.json for ESM"

if [ -f "nx.json" ]; then
  # Create a backup if it doesn't exist
  if [ ! -f "nx.json.esm.bak" ]; then
    cp "nx.json" "nx.json.esm.bak"
  fi
  
  # Create updated nx.json with ESM configurations
  cat > "nx.json" << 'EOL'
{
  "extends": "nx/presets/npm.json",
  "npmScope": "dulce-de-saigon",
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": [
          "build",
          "lint",
          "test",
          "e2e",
          "typecheck"
        ],
        "accessToken": "YTYyYTU5ZGUtYzBkMS00NzE0LWE2ZjAtNWJlYTk1YTliZTFhfHJlYWQtd3JpdGU="
      }
    }
  },
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "libs"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": [
        "^build"
      ],
      "inputs": [
        "production",
        "^production"
      ],
      "options": {
        "module": "NodeNext",
        "moduleResolution": "NodeNext"
      }
    },
    "test": {
      "inputs": [
        "default",
        "^production",
        "{workspaceRoot}/jest.preset.mjs"
      ]
    },
    "lint": {
      "inputs": [
        "default",
        "{workspaceRoot}/.eslintrc.json"
      ]
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit"
      }
    }
  },
  "namedInputs": {
    "default": [
      "{projectRoot}/**/*",
      "sharedGlobals"
    ],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/.storybook/**/*",
      "!{projectRoot}/**/*.stories.@(js|jsx|ts|tsx|mdx)",
      "!{projectRoot}/src/test-setup.[jt]s"
    ],
    "sharedGlobals": []
  },
  "generators": {
    "@nx/react": {
      "application": {
        "style": "styled-components",
        "linter": "eslint",
        "bundler": "vite",
        "babel": true
      },
      "component": {
        "style": "styled-components"
      },
      "library": {
        "style": "styled-components",
        "linter": "eslint"
      }
    }
  }
}
EOL
  
  print_success "Updated nx.json for ESM compatibility"
else
  print_error "nx.json not found"
fi

# Step 2: Fix jest.preset.mjs
print_step "2" "Updating jest.preset.mjs for ESM compatibility"

# Create or update jest.preset.mjs
cat > "jest.preset.mjs" << 'EOL'
// jest.preset.mjs
export default {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
      useESM: true,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  extensionsToTreatAsEsm: ['.ts'],
  coverageReporters: ['html', 'lcov', 'text'],
  preset: 'ts-jest/presets/js-with-ts-esm',
};
EOL

print_success "Updated jest.preset.mjs for ESM compatibility"

# Step 3: Create a basic build check script
print_step "3" "Creating a build check script"

cat > "build-check.sh" << 'EOL'
#!/bin/bash

# ANSI color codes for formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}=== ESM Build Check ===${NC}\n"

# Build a specific library to check ESM compatibility
echo -e "${BOLD}${MAGENTA}Building @dulce/utils/signals for ESM compatibility check...${NC}"

# Run the build
pnpm nx build utils-signals

# Check if the build succeeded
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build succeeded! The ESM configuration is working.${NC}"
  
  # Check the output files for ESM syntax
  echo -e "\n${BOLD}${MAGENTA}Checking output files for ESM syntax...${NC}"
  
  if grep -q "export " dist/libs/utils/signals/*.js; then
    echo -e "${GREEN}✓ ESM export statements found in the output files.${NC}"
  else
    echo -e "${YELLOW}⚠ No ESM export statements found in the output files.${NC}"
  fi
  
  if grep -q "import " dist/libs/utils/signals/*.js; then
    echo -e "${GREEN}✓ ESM import statements found in the output files.${NC}"
  else
    echo -e "${YELLOW}⚠ No ESM import statements found in the output files.${NC}"
  fi
else
  echo -e "${RED}❌ Build failed. There may still be ESM configuration issues to fix.${NC}"
fi

echo -e "\n${BOLD}${CYAN}=== ESM Build Check Complete ===${NC}"
EOL

chmod +x build-check.sh

print_success "Created build-check.sh script"

# Step 4: Update package.json for ESM testing
print_step "4" "Updating package.json for ESM testing"

if [ -f "package.json" ]; then
  # Create a backup if it doesn't exist
  if [ ! -f "package.json.esm.bak" ]; then
    cp "package.json" "package.json.esm.bak"
  fi
  
  # Add ESM test script
  jq '.scripts["esm:check"] = "./build-check.sh"' "package.json" > "package.json.tmp" && mv "package.json.tmp" "package.json"
  
  print_success "Added esm:check script to package.json"
else
  print_error "package.json not found"
fi

print_header "Nx Configuration Fix for ESM Complete"
print_success "The Nx configuration has been updated for ESM compatibility!"
echo
echo "Next steps:"
echo "1. Run 'pnpm esm:check' to verify ESM build compatibility"
echo "2. Fix any remaining issues identified during the build"
echo "3. Run individual library builds to ensure all components are ESM-compatible"
echo
print_success "Done!"
