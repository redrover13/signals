#!/bin/bash

# Fix ES Module Compatibility Issues Comprehensively
# This script combines multiple fixes to address ES Module compatibility issues in the codebase

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
  read -r -p "${YELLOW}$1 [y/N] ${NC}" response
  case "$response" in
    [yY][eE][sS]|[yY]) 
      true
      ;;
    *)
      false
      ;;
  esac
}

# Check for dry run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  print_warning "DRY RUN MODE: No changes will be made to files"
fi

# Print intro
echo -e "${BOLD}${MAGENTA}ES Module Compatibility Fixer${NC}"
echo -e "This script will comprehensively fix ES Module compatibility issues in the codebase"

# Confirm before proceeding
if [[ "$DRY_RUN" != true ]]; then
  if ! confirm "Do you want to proceed with fixing ES Module compatibility issues?"; then
    print_warning "Operation cancelled by user"
    exit 0
  fi
fi

# Step 1: Analyze the codebase to understand the scope of issues
print_step "1" "Analyzing codebase for ES Module compatibility issues"
node scripts/analyze-es-compatibility.js

# Ask if user wants to continue after seeing analysis
if ! confirm "Continue with fixing the issues?"; then
  print_warning "Operation cancelled by user"
  exit 0
fi

# Step 2: Fix mixed module syntax
print_step "2" "Fixing files with mixed module syntax"
if [[ "$DRY_RUN" == true ]]; then
  node scripts/fix-module-syntax.js --dry-run --fix-all
  print_warning "Dry run: No changes were made"
else
  node scripts/fix-module-syntax.js --fix-all
  print_success "Mixed module syntax fixed"
fi

# Step 3: Add file extensions to imports
print_step "3" "Adding file extensions to imports"
if [[ "$DRY_RUN" == true ]]; then
  node scripts/fix-import-extensions.js --dry-run --fix-all
  print_warning "Dry run: No changes were made"
else
  node scripts/fix-import-extensions.js --fix-all
  print_success "File extensions added to imports"
fi

# Step 4: Convert remaining CommonJS files to ES Modules
print_step "4" "Converting remaining CommonJS files to ES Modules"
if [[ "$DRY_RUN" == true ]]; then
  node scripts/fix-module-syntax.js --dry-run --convert-to-esm
  print_warning "Dry run: No changes were made"
else
  if confirm "Convert remaining CommonJS files to ES Modules? (Alternative is to rename them to .cjs)"; then
    node scripts/fix-module-syntax.js --convert-to-esm
    print_success "Converted CommonJS files to ES Modules"
  else
    if confirm "Rename pure CommonJS files to .cjs?"; then
      node scripts/fix-module-syntax.js --rename-cjs
      print_success "Renamed pure CommonJS files to .cjs"
    else
      print_warning "Skipped handling remaining CommonJS files"
    fi
  fi
fi

# Step 5: Verify TypeScript compilation
print_step "5" "Verifying TypeScript compilation"
echo -e "Running TypeScript compiler to check for errors after fixes..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  print_success "TypeScript compilation successful"
else
  print_error "TypeScript compilation failed. Some issues may require manual fixing."
fi

# Step 6: Run ESLint to check for and fix remaining issues
print_step "6" "Running ESLint to check for and fix remaining issues"
if [[ "$DRY_RUN" == true ]]; then
  echo "ESLint check only (no fixes in dry run mode)"
  npx nx run-many --target=lint --all
else
  if confirm "Run ESLint with --fix option to automatically fix issues?"; then
    npx nx run-many --target=lint --all --fix
    print_success "ESLint fixes applied"
  else
    npx nx run-many --target=lint --all
    print_warning "ESLint ran without applying fixes"
  fi
fi

# Final summary
print_header "Summary"
echo -e "ES Module compatibility fixes have been applied to the codebase."
if [[ "$DRY_RUN" == true ]]; then
  print_warning "This was a dry run. No actual changes were made."
fi

echo -e "\nNext steps:"
echo -e "1. Review the changes made by the scripts"
echo -e "2. Fix any remaining TypeScript or ESLint errors manually"
echo -e "3. Test the application to ensure everything still works"
echo -e "4. Commit the changes to version control\n"

print_success "Done!"
