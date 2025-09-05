#!/bin/bash

# Add File Extensions to Imports Script
# This script adds file extensions to import statements in ES Module files

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

# Directories to process
directories=(
  "libs/adk" 
  "libs/agents-sdk" 
  "libs/agents/gemini-orchestrator" 
  "libs/agents/crm-agent" 
  "libs/agents/content-agent"
  "libs/utils/secrets-manager"
  "libs/utils/api-clients"
  "libs/utils/monitoring"
  "libs/security"
  "libs/env"
  "libs/mcp"
  "apps/looker-dashboards"
  "apps/agents"
  "apps/api"
  "scripts"
)

print_header "Adding File Extensions to Imports"

# Process each directory
for dir in "${directories[@]}"; do
  print_step "$dir" "Adding file extensions to imports in $dir"
  
  # Find TypeScript/JavaScript files in this directory
  echo "Finding files in $dir..."
  files_to_process=$(find "$dir" -type f \( -name "*.js" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/coverage/*" 2>/dev/null || true)
  
  if [ -z "$files_to_process" ]; then
    print_warning "No files found in $dir"
    continue
  fi
  
  echo "Found $(echo "$files_to_process" | wc -l) files in $dir"
  
  # Process each file
  echo "$files_to_process" | while read -r file; do
    echo "Processing $file..."
    
    # Create backup if it doesn't exist
    if [ ! -f "${file}.bak" ]; then
      cp "$file" "${file}.bak"
    fi
    
    # Read file content
    content=$(cat "$file")
    
    # Apply conversions to add file extensions
    # 1. Add .js extension to relative imports that don't have an extension
    content=$(echo "$content" | sed -E "s/from ['\"](\\.\\./from '\\1.js/g")
    content=$(echo "$content" | sed -E "s/from ['\"](\\./from '\\1.js/g")
    
    # Avoid adding extensions to package imports or imports with extensions already
    content=$(echo "$content" | sed -E "s/from '(.*)\\.js\\.js'/from '\\1.js'/g")
    content=$(echo "$content" | sed -E "s/from '(.*)\\.ts\\.js'/from '\\1.ts'/g")
    
    # Write updated content back to file
    echo "$content" > "$file"
    
    print_success "Processed $file"
  done
done

print_header "Import Extension Summary"
print_success "Completed adding file extensions to imports!"
echo "Note: Original files were backed up with .bak extension (if not already backed up)"
echo "You should review the modified files and fix any remaining issues manually"
