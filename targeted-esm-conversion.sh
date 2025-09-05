#!/bin/bash

# Targeted ESM Conversion Script
# This script converts files to ES modules one directory at a time to avoid buffer overflows

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

print_header "Targeted ESM Conversion"

# Process each directory
for dir in "${directories[@]}"; do
  print_step "$dir" "Converting files in $dir to ES Modules"
  
  # Find files with CommonJS syntax in this directory
  echo "Finding files with CommonJS syntax in $dir..."
  files_to_convert=$(find "$dir" -type f \( -name "*.js" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" | xargs grep -l "require\\|module.exports\\|exports\\." 2>/dev/null || true)
  
  if [ -z "$files_to_convert" ]; then
    print_success "No CommonJS files found in $dir"
    continue
  fi
  
  echo "Found $(echo "$files_to_convert" | wc -l) files with CommonJS syntax in $dir"
  
  # Convert each file
  echo "$files_to_convert" | while read -r file; do
    echo "Converting $file to ES Modules..."
    
    # Read file content
    content=$(cat "$file")
    
    # Create backup
    cp "$file" "${file}.bak"
    
    # Apply conversions
    # 1. Convert require statements to import
    content=$(echo "$content" | sed -E 's/const ([a-zA-Z0-9_]+) = require\(['"'"'"](.*)['"'"'"]\)/import \1 from "\2"/g')
    content=$(echo "$content" | sed -E 's/const \{ ([a-zA-Z0-9_,\s]+) \} = require\(['"'"'"](.*)['"'"'"]\)/import { \1 } from "\2"/g')
    
    # 2. Convert module.exports to export default
    content=$(echo "$content" | sed -E 's/module\.exports = ([a-zA-Z0-9_]+)/export default \1/g')
    content=$(echo "$content" | sed -E 's/module\.exports = \{/export default {/g')
    
    # 3. Convert exports.X = Y to export const X = Y
    content=$(echo "$content" | sed -E 's/exports\.([a-zA-Z0-9_]+) = ([a-zA-Z0-9_]+)/export const \1 = \2/g')
    
    # Write updated content back to file
    echo "$content" > "$file"
    
    print_success "Converted $file to ES Modules"
  done
done

print_header "ESM Conversion Summary"
print_success "Completed targeted ESM conversion!"
echo "Note: Original files were backed up with .bak extension"
echo "You should review the converted files and fix any remaining issues manually"
