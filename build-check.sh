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
pnpm nx build signals

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
