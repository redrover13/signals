#!/bin/bash

# Fix TypeScript Configuration Script
# This script specifically fixes TypeScript configuration issues

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

print_header "TypeScript Configuration Fix"

# Step 1: Fix the main tsconfig.json file
print_step "1" "Fixing main tsconfig.json"

# Update tsconfig.json to ensure proper module resolution
cat > tsconfig.json << 'EOL'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "skipLibCheck": true,
    "noEmit": true
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.references.json"
    }
  ]
}
EOL

print_success "Updated tsconfig.json"

# Step 2: Fix project-specific tsconfig.json files
print_step "2" "Fixing project-specific tsconfig.json files"

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
  
  # Create a new tsconfig.json file with proper ESM configuration
  cat > "$tsconfig_file" << EOL
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "../../dist/out-tsc",
    "declaration": true,
    "types": ["node", "jest"]
  },
  "files": [],
  "include": ["**/*.ts"],
  "exclude": ["jest.config.ts", "**/*.spec.ts", "**/*.test.ts", "**/*.d.ts"]
}
EOL
  
  print_success "Updated $tsconfig_file"
done

# Step 3: Fix the project.json files to ensure they have the typecheck target
print_step "3" "Fixing project.json files"

# Find all project.json files
find ./libs ./apps -name "project.json" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while read project_json; do
  # Skip node_modules and dist directories
  if [[ "$project_json" == *"node_modules"* ]] || [[ "$project_json" == *"dist"* ]]; then
    continue
  fi
  
  # Create backup if it doesn't exist
  if [ ! -f "${project_json}.bak" ]; then
    cp "$project_json" "${project_json}.bak"
  fi
  
  # Update the project.json to include a typecheck target if it doesn't have one
  # Using jq to safely modify JSON
  if ! jq -e '.targets.typecheck' "$project_json" > /dev/null 2>&1; then
    jq '.targets.typecheck = {"executor": "nx:run-commands", "options": {"commands": ["tsc --noEmit -p ./tsconfig.json"]}}' "$project_json" > "${project_json}.tmp" && mv "${project_json}.tmp" "$project_json"
    print_success "Added typecheck target to $project_json"
  else
    print_warning "Typecheck target already exists in $project_json"
  fi
done

# Step 4: Fix the base tsconfig.json to ensure it's ESM-compatible
print_step "4" "Ensuring base tsconfig.json is ESM-compatible"

# Create a backup of tsconfig.base.json if it doesn't exist
if [ ! -f "tsconfig.base.json.bak" ]; then
  cp "tsconfig.base.json" "tsconfig.base.json.bak"
fi

# Update tsconfig.base.json
jq '.compilerOptions.module = "NodeNext" | .compilerOptions.moduleResolution = "NodeNext" | .compilerOptions.target = "ES2022" | .compilerOptions.lib = ["ES2022", "dom"]' "tsconfig.base.json" > "tsconfig.base.json.tmp" && mv "tsconfig.base.json.tmp" "tsconfig.base.json"

print_success "Updated tsconfig.base.json for ESM compatibility"

# Step 5: Update package.json scripts
print_step "5" "Updating package.json scripts"

# Create a backup of package.json if it doesn't exist
if [ ! -f "package.json.bak" ]; then
  cp "package.json" "package.json.bak"
fi

# Add a more explicit typescript check command
jq '.scripts["ts:check"] = "nx run-many --target=typecheck --all --skip-nx-cache"' "package.json" > "package.json.tmp" && mv "package.json.tmp" "package.json"

print_success "Updated package.json scripts"

print_header "TypeScript Configuration Fix Complete"
print_success "The TypeScript configuration has been fixed!"
echo
echo "Next steps:"
echo "1. Run 'pnpm install' to ensure all dependencies are correctly installed"
echo "2. Run 'pnpm ts:check' to verify the TypeScript configuration"
echo "3. If there are still issues, check individual project tsconfig.json files"
echo
print_success "Done!"
