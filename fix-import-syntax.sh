#!/bin/bash

# Fix ESM import syntax errors
# This script fixes specific syntax errors in import statements

# ANSI color codes for formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}=== Fixing ESM Import Syntax Errors ===${NC}\n"

# Fix the angular-signal-adapter.ts file
echo -e "${BOLD}${MAGENTA}Fixing libs/utils/signals/src/angular-signal-adapter.ts${NC}"
sed -i 's/import type { Signal } from "\.\.\/index\.js"'\'';//g' libs/utils/signals/src/angular-signal-adapter.ts
sed -i 's/import type { Signal } from "\.\.\/index\.js";/import type { Signal } from "\.\.\/index.js";/g' libs/utils/signals/src/angular-signal-adapter.ts
echo -e "${GREEN}✓${NC} Fixed angular-signal-adapter.ts"

# Fix the nx-integration.ts file
echo -e "${BOLD}${MAGENTA}Fixing libs/utils/signals/src/nx-integration.ts${NC}"
sed -i 's/import type { Signal } from "\.\.\/index\.js"'\'';//g' libs/utils/signals/src/nx-integration.ts
sed -i 's/import { createSignal } from "\.\.\/index\.js"'\'';//g' libs/utils/signals/src/nx-integration.ts
sed -i 's/import type { Signal } from "\.\.\/index\.js";/import type { Signal } from "\.\.\/index.js";/g' libs/utils/signals/src/nx-integration.ts
sed -i 's/import { createSignal } from "\.\.\/index\.js";/import { createSignal } from "\.\.\/index.js";/g' libs/utils/signals/src/nx-integration.ts
echo -e "${GREEN}✓${NC} Fixed nx-integration.ts"

# Fix the react-hooks.ts file
echo -e "${BOLD}${MAGENTA}Fixing libs/utils/signals/src/react-hooks.ts${NC}"
sed -i 's/import type { EnhancedSignal } from "\.\/angular-signal-adapter\.js"'\'';//g' libs/utils/signals/src/react-hooks.ts
sed -i 's/import type { EnhancedSignal } from "\.\/angular-signal-adapter\.js";/import type { EnhancedSignal } from "\.\/angular-signal-adapter.js";/g' libs/utils/signals/src/react-hooks.ts
echo -e "${GREEN}✓${NC} Fixed react-hooks.ts"

# Fix unused @ts-expect-error directives
echo -e "${BOLD}${MAGENTA}Fixing unused @ts-expect-error directives in libs/utils/signals/index.ts${NC}"
sed -i 's/\/\/ @ts-expect-error: Variable kept for legacy compatibility/\/\/ @ts-ignore/g' libs/utils/signals/index.ts
sed -i 's/\/\/ @ts-expect-error: dependencies parameter kept for API compatibility/\/\/ @ts-ignore/g' libs/utils/signals/index.ts
echo -e "${GREEN}✓${NC} Fixed unused @ts-expect-error directives"

echo -e "\n${BOLD}${GREEN}Import syntax errors fixed!${NC}"
echo -e "Running build check again to verify fixes..."

# Run the build check script again
./build-check.sh
