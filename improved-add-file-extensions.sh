#!/bin/bash

# Add file extensions to import statements
# This script adds .js extensions to import statements for ES Modules compatibility

# ANSI color codes for formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}=== Adding .js extensions to imports ===${NC}\n"

# Process each TypeScript file
find libs apps -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
  # Skip .d.ts files
  if [[ "$file" == *".d.ts" ]]; then
    continue
  fi
  
  # Skip node_modules and dist directories
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]]; then
    continue
  fi

  # Create a backup if it doesn't already exist
  if [ ! -f "${file}.bak" ]; then
    cp "$file" "${file}.bak"
  fi

  # Fix import statements without file extensions
  # This adds .js to relative imports that don't already have a file extension
  # Pattern: import something from './path/to/file' -> import something from './path/to/file.js'
  perl -i -pe 's/import\s+(.+?)\s+from\s+['"'"'"]([\.\/][^'"'"'"]+?)(?=['"'"'"])/import $1 from "$2.js"/g' "$file"
  
  # Fix dynamic imports without file extensions
  # Pattern: import('./path/to/file') -> import('./path/to/file.js')
  perl -i -pe 's/import\s*\(\s*['"'"'"]([\.\/][^'"'"'"]+?)(?=['"'"'"])/import("$1.js"/g' "$file"
  
  # Avoid adding duplicate extensions
  # This removes duplicate .js.js extensions that might have been added
  perl -i -pe 's/\.js\.js/\.js/g' "$file"
  
  echo -e "${GREEN}✓${NC} Processed $file"
done

echo -e "\n${BOLD}${GREEN}File extension update complete!${NC}"
