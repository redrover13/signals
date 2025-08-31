#!/bin/bash
# Script to update lodash to lodash-es across the project

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Updating project to use lodash-es instead of lodash...${NC}"

# 1. Find all package.json files in the project
PACKAGE_FILES=$(find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.nx/*")

# Counter for modified files
MODIFIED_COUNT=0

for PACKAGE_FILE in $PACKAGE_FILES; do
  echo -e "Processing ${YELLOW}$PACKAGE_FILE${NC}..."
  
  # Check if the file contains lodash dependency but not lodash-es
  if grep -q '"lodash":' "$PACKAGE_FILE" && ! grep -q '"lodash-es":' "$PACKAGE_FILE"; then
    # Get the current lodash version
    LODASH_VERSION=$(grep -o '"lodash": *"[^"]*"' "$PACKAGE_FILE" | grep -o '"[^"]*"' | tail -1)
    
    # Replace lodash with lodash-es
    sed -i 's/"lodash": *"[^"]*"/"lodash-es": "^4.17.21"/g' "$PACKAGE_FILE"
    
    # Replace @types/lodash with @types/lodash-es if it exists
    if grep -q '"@types/lodash":' "$PACKAGE_FILE"; then
      sed -i 's/"@types\/lodash": *"[^"]*"/"@types\/lodash-es": "^4.17.20"/g' "$PACKAGE_FILE"
    fi
    
    echo -e "${GREEN}Updated lodash to lodash-es in $PACKAGE_FILE${NC}"
    MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
  fi
  
  # Add lodash override if there's an overrides section but no lodash override
  if grep -q '"overrides":' "$PACKAGE_FILE" && ! grep -q '"lodash":' "$PACKAGE_FILE"; then
    # Find the line with "overrides": {
    LINE_NUM=$(grep -n '"overrides": {' "$PACKAGE_FILE" | cut -d: -f1)
    if [ ! -z "$LINE_NUM" ]; then
      # Add the lodash override after the opening brace
      sed -i "$((LINE_NUM + 1))i\      \"lodash\": \"npm:lodash-es@^4.17.21\"," "$PACKAGE_FILE"
      echo -e "${GREEN}Added lodash override in $PACKAGE_FILE${NC}"
      MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
    fi
  fi
done

echo -e "${GREEN}Updated $MODIFIED_COUNT package.json files to use lodash-es${NC}"

# 2. Find all TypeScript/JavaScript imports of lodash and update them
echo -e "${YELLOW}Searching for lodash imports in code files...${NC}"

# Counter for modified files
CODE_MODIFIED_COUNT=0

# Find all TypeScript and JavaScript files
TS_JS_FILES=$(find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules" | grep -v ".nx")

for FILE in $TS_JS_FILES; do
  # Check if file imports lodash
  if grep -q "from ['\"]\lodash['\"]" "$FILE" || grep -q "require(['\"]\lodash['\"])" "$FILE"; then
    # Replace lodash imports with lodash-es
    sed -i "s/from ['\"]\lodash['\"])/from 'lodash-es')/g" "$FILE"
    sed -i "s/from ['\"]\lodash['\"]/from 'lodash-es'/g" "$FILE"
    sed -i "s/require(['\"]\lodash['\"]\)/require('lodash-es')/g" "$FILE"
    
    echo -e "${GREEN}Updated lodash imports in $FILE${NC}"
    CODE_MODIFIED_COUNT=$((CODE_MODIFIED_COUNT + 1))
  fi
  
  # Check for lodash submodule imports (e.g., from 'lodash/map')
  if grep -q "from ['\"]\lodash\/" "$FILE"; then
    # Replace lodash submodule imports with lodash-es
    sed -i "s/from ['\"]\lodash\//from 'lodash-es\//g" "$FILE"
    
    echo -e "${GREEN}Updated lodash submodule imports in $FILE${NC}"
    CODE_MODIFIED_COUNT=$((CODE_MODIFIED_COUNT + 1))
  fi
done

echo -e "${GREEN}Updated lodash imports in $CODE_MODIFIED_COUNT code files${NC}"
echo -e "${YELLOW}Update complete. Run 'pnpm install' to install the new dependencies.${NC}"
