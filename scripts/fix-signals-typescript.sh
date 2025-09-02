#!/bin/bash

# Script to fix TypeScript signals module issues

echo "Fixing TypeScript signals module issues..."

# Fix specific files with the most issues
SIGNALS_FILES=(
  "/home/g_nelson/signals-1/libs/utils/signals/index.ts"
  "/home/g_nelson/signals-1/libs/utils/signals/src/index.ts"
  "/home/g_nelson/signals-1/libs/utils/signals/src/nx-integration.ts"
)

for file in "${SIGNALS_FILES[@]}"; do
  echo "Fixing file: $file"
  # Replace "string || undefined" with "string | undefined" in type annotations
  sed -i 's/\([a-zA-Z0-9]\+\) || undefined/\1 | undefined/g' "$file"
  
  # Fix other signal specific issues
  sed -i 's/boolean || undefined/boolean | undefined/g' "$file"
  sed -i 's/Error || undefined/Error | undefined/g' "$file"
  sed -i 's/number || undefined/number | undefined/g' "$file"
  sed -i 's/void || undefined/void | undefined/g' "$file"
  sed -i 's/any || undefined/any | undefined/g' "$file"
done

# Also fix secrets-manager issues
echo "Fixing secrets-manager issues..."
sed -i 's/\([a-zA-Z0-9]\+\) || undefined/\1 | undefined/g' "/home/g_nelson/signals-1/libs/utils/secrets-manager/src/index.ts"

# Fix demo-opentelemetry.ts
echo "Fixing demo-opentelemetry.ts issues..."
sed -i 's/number || undefined/number | undefined/g' "/home/g_nelson/signals-1/scripts/demo-opentelemetry.ts"

echo "TypeScript signals module issues fixed."
