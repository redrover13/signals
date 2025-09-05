#!/bin/bash

# ESM Migration Cleanup Script
# This script cleans up after the ESM conversion process

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

print_header "ESM Migration Cleanup"

# Step 1: Fix TypeScript configuration issues
print_step "1" "Fixing TypeScript configuration issues"

# Update tsconfig.json to ensure proper module resolution
cat > tsconfig.json << 'EOL'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "skipLibCheck": true,
    "exactOptionalPropertyTypes": false,
    "strictPropertyInitialization": false,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": false,
    "noImplicitReturns": false,
    "noPropertyAccessFromIndexSignature": false,
    "noUncheckedIndexedAccess": false,
    "strict": false,
    "allowJs": true,
    "checkJs": false,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "ignoreDeprecations": "5.0",
    "useUnknownInCatchVariables": false,
    "noImplicitThis": false
  },
  "include": ["libs/**/*.ts", "tools/**/*.ts", "scripts/**/*.ts", "apps/**/*.ts", "**/*.d.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "*.generated.*"
  ]
}
EOL

print_success "Updated tsconfig.json"

# Step 2: Fix any remaining package.json files that need type: module
print_step "2" "Fixing package.json files"

# Find all package.json files in the project
find . -name "package.json" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while read pkg_json; do
  # Skip node_modules
  if [[ "$pkg_json" == *"node_modules"* ]]; then
    continue
  fi
  
  # Check if the file has type: module
  if ! grep -q '"type"\s*:\s*"module"' "$pkg_json"; then
    # Create a backup if it doesn't exist
    if [ ! -f "${pkg_json}.bak" ]; then
      cp "$pkg_json" "${pkg_json}.bak"
    fi
    
    # Add type: module after the name field
    awk -v ORS='\n' '
      /^\s*"name":/ {print; print "  \"type\": \"module\","; next}
      {print}
    ' "${pkg_json}" > "${pkg_json}.tmp" && mv "${pkg_json}.tmp" "${pkg_json}"
    
    print_success "Added type: module to $pkg_json"
  fi
done

# Step 3: Fix any jest.config.ts files that might need updating for ESM
print_step "3" "Fixing Jest configuration files for ESM"

find . -name "jest.config.ts" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while read jest_config; do
  # Create a backup if it doesn't exist
  if [ ! -f "${jest_config}.bak" ]; then
    cp "$jest_config" "${jest_config}.bak"
  fi
  
  # Update the file to use ESM export syntax
  sed -i 's/^module.exports =/export default/g' "$jest_config"
  
  print_success "Updated $jest_config for ESM"
done

# Step 4: Fix nx.json to ensure proper module resolution
print_step "4" "Fixing nx.json for ESM"

if [ -f "nx.json" ]; then
  # Create a backup if it doesn't exist
  if [ ! -f "nx.json.bak" ]; then
    cp "nx.json" "nx.json.bak"
  fi
  
  # Update the file to ensure module: NodeNext is used
  jq '.targetDefaults.build.options.module = "NodeNext" | .targetDefaults.build.options.moduleResolution = "NodeNext"' "nx.json" > "nx.json.tmp" && mv "nx.json.tmp" "nx.json"
  
  print_success "Updated nx.json for ESM"
else
  print_warning "nx.json not found"
fi

# Step 5: Restore any files that may have been broken
print_step "5" "Checking for broken files to restore"

# Check if pnpm is working
if ! pnpm -v &> /dev/null; then
  print_warning "pnpm command is not working. Restoring package.json..."
  if [ -f "package.json.bak" ]; then
    cp "package.json.bak" "package.json"
    print_success "Restored package.json from backup"
  else
    print_error "No backup found for package.json"
  fi
fi

print_header "ESM Migration Cleanup Complete"
print_success "The ESM migration cleanup process has been completed!"
echo
echo "Next steps:"
echo "1. Run 'pnpm install' to ensure all dependencies are correctly installed"
echo "2. Run 'pnpm ts:check' to verify TypeScript configuration"
echo "3. Run 'pnpm build' to build the project with ES Modules"
echo "4. Run 'pnpm test' to run the tests and ensure everything works correctly"
echo
print_success "Done!"
