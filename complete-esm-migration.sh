#!/bin/bash

# Complete ESM Migration Script
# This script performs a complete migration from CommonJS to ES Modules for the project

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

# Ask for confirmation
function confirm() {
  read -p "$1 (y/n) " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]]
}

# Check if script is run with --dry-run
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  print_warning "Running in dry-run mode. No changes will be made."
fi

# Make sure we're in the project root
cd "$(dirname "$0")"

print_header "Complete ESM Migration"
echo "This script will complete the migration from CommonJS to ES Modules for the project."
echo "It combines all the previous conversion scripts and addresses any remaining issues."

if [[ "$DRY_RUN" == false ]]; then
  if ! confirm "This script will make changes to your codebase. Continue?"; then
    print_error "Migration cancelled."
    exit 1
  fi
fi

# Step 1: Run the existing comprehensive fix script
print_step "1" "Running existing ESM fixes"
if [[ "$DRY_RUN" == true ]]; then
  print_warning "Dry run: Skipping existing fix script"
else
  chmod +x /home/g_nelson/signals-1/fix-es-modules-comprehensive.sh
  /home/g_nelson/signals-1/fix-es-modules-comprehensive.sh
  print_success "Completed existing fixes"
fi

# Step 2: Update tsconfig files to ensure ESM compatibility
print_step "2" "Updating TypeScript configurations for ESM"
if [[ "$DRY_RUN" == true ]]; then
  print_warning "Dry run: No changes to tsconfig files"
else
  # Find all tsconfig.json files and ensure they use NodeNext module system
  find . -name "tsconfig*.json" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while read tsconfig; do
    echo "Checking $tsconfig..."
    
    # Use temporary files for safer sed operations
    tmp_file=$(mktemp)
    
    # Update module and moduleResolution to NodeNext
    if grep -q '"module"\s*:' "$tsconfig"; then
      sed -E 's/"module"\s*:\s*"[^"]*"/"module": "NodeNext"/g' "$tsconfig" > "$tmp_file" && mv "$tmp_file" "$tsconfig"
      print_success "Updated module setting in $tsconfig"
    fi
    
    if grep -q '"moduleResolution"\s*:' "$tsconfig"; then
      sed -E 's/"moduleResolution"\s*:\s*"[^"]*"/"moduleResolution": "NodeNext"/g' "$tsconfig" > "$tmp_file" && mv "$tmp_file" "$tsconfig"
      print_success "Updated moduleResolution setting in $tsconfig"
    else
      # Add moduleResolution if it doesn't exist
      sed -E 's/("compilerOptions"\s*:\s*\{)/\1\n    "moduleResolution": "NodeNext",/g' "$tsconfig" > "$tmp_file" && mv "$tmp_file" "$tsconfig"
      print_success "Added moduleResolution setting to $tsconfig"
    fi
  done
fi

# Step 3: Run fix-typescript-es-modules-final.sh script
print_step "3" "Running final TypeScript ESM fixes"
if [[ "$DRY_RUN" == true ]]; then
  print_warning "Dry run: Skipping TypeScript final fixes"
else
  chmod +x /home/g_nelson/signals-1/fix-typescript-es-modules-final.sh
  /home/g_nelson/signals-1/fix-typescript-es-modules-final.sh
  print_success "Completed final TypeScript ESM fixes"
fi

# Step 4: Fix any remaining module imports in package.json files
print_step "4" "Updating package.json files for ESM"
if [[ "$DRY_RUN" == true ]]; then
  print_warning "Dry run: No changes to package.json files"
else
  # Find all package.json files
  find . -name "package.json" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while read pkg_json; do
    echo "Checking $pkg_json..."
    
    # Skip node_modules
    if [[ "$pkg_json" == *"node_modules"* ]]; then
      continue
    fi
    
    # Add "type": "module" to package.json files that don't have it
    if ! grep -q '"type"\s*:\s*"module"' "$pkg_json"; then
      tmp_file=$(mktemp)
      sed -E '/"name"\s*:/a\  "type": "module",' "$pkg_json" > "$tmp_file" && mv "$tmp_file" "$pkg_json"
      print_success "Added 'type: module' to $pkg_json"
    fi
    
    # Fix main field in package.json to use .js extension if missing
    if grep -q '"main"\s*:\s*"[^"]*\.ts"' "$pkg_json"; then
      tmp_file=$(mktemp)
      sed -E 's/"main"\s*:\s*"([^"]*).ts"/"main": "\1.js"/g' "$pkg_json" > "$tmp_file" && mv "$tmp_file" "$pkg_json"
      print_success "Updated main field in $pkg_json to use .js extension"
    fi
    
    # Fix exports field in package.json if it exists
    if grep -q '"exports"\s*:' "$pkg_json"; then
      tmp_file=$(mktemp)
      # Replace .ts with .js in exports field
      sed -E 's/("exports"[^}]*"[^"]*"\s*:\s*"[^"]*).ts"/\1.js"/g' "$pkg_json" > "$tmp_file" && mv "$tmp_file" "$pkg_json"
      print_success "Updated exports field in $pkg_json to use .js extensions"
    fi
  done
fi

# Step 5: Scan codebase for remaining CommonJS syntax
print_step "5" "Scanning for remaining CommonJS syntax"
print_warning "This step only identifies remaining issues but does not fix them automatically"

# Find files that still use require or module.exports (avoid buffer overflows by processing in batches)
echo "Searching for CommonJS patterns in files..."
remaining_files=""
directories_to_check=("./libs" "./apps" "./scripts" "./tools")

for dir in "${directories_to_check[@]}"; do
  echo "Checking directory: $dir"
  dir_files=$(find "$dir" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.mjs" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -not -path "*/coverage/*" 2>/dev/null)
  
  # Process files in batches to avoid buffer overflow
  echo "$dir_files" | while read -r file; do
    if [ -n "$file" ]; then
      if grep -q "require\\|module.exports\\|exports\\." "$file" 2>/dev/null; then
        echo "$file"
        remaining_files="$remaining_files
$file"
      fi
    fi
  done
done

if [[ -n "$remaining_files" ]]; then
  print_warning "The following files still contain CommonJS syntax:"
  echo "$remaining_files"
  echo
  echo "To handle these files, you can:"
  echo "1. Convert them to ES Modules syntax manually"
  echo "2. Rename them to .cjs extension to keep using CommonJS"
  echo "3. Run 'node scripts/fix-module-syntax.js --convert-to-esm' to attempt automatic conversion"
  echo "4. Run 'node scripts/fix-module-syntax.js --rename-cjs' to rename them to .cjs"
else
  print_success "No files with CommonJS syntax were found!"
fi

# Step 6: Verify project builds with ESM
print_step "6" "Verifying project builds correctly with ESM"
if [[ "$DRY_RUN" == true ]]; then
  print_warning "Dry run: Skipping build verification"
else
  # Run TypeScript check
  echo "Running TypeScript check..."
  pnpm ts:check
  
  if [ $? -eq 0 ]; then
    print_success "TypeScript check passed!"
  else
    print_error "TypeScript check failed. Some issues may still need to be fixed manually."
  fi
  
  # Run build
  echo "Building project..."
  pnpm ts:build
  
  if [ $? -eq 0 ]; then
    print_success "Project built successfully with ES Modules!"
  else
    print_error "Project build failed. Some issues may still need to be fixed manually."
  fi
fi

print_header "ESM Migration Summary"

if [[ "$DRY_RUN" == true ]]; then
  print_warning "This was a dry run. No changes were made."
else
  print_success "ESM migration process has been completed!"
  echo
  echo "Next steps:"
  echo "1. Run tests to ensure everything is working correctly: pnpm test"
  echo "2. If any issues remain, check the output of step 5 for files that may need manual attention"
  echo "3. Consider adding 'exports' field to package.json files for better compatibility"
  echo "4. Update import statements in your documentation if needed"
fi

print_success "Done!"
