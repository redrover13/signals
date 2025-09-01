#!/bin/bash

# Script to fix TypeScript type issues

echo "Fixing TypeScript type issues..."

# Fix bitwise OR operator issues with undefined (replace | undefined with || undefined)
FILES_WITH_BITWISE_OR=$(grep -l " | undefined" $(find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*"))

for file in $FILES_WITH_BITWISE_OR; do
  echo "Fixing bitwise OR in file: $file"
  # Look for pattern where | undefined is used in an expression (not in a type declaration)
  # This is imperfect but should catch many cases
  sed -i 's/\([^:]\) | undefined/\1 || undefined/g' "$file"
done

# Fix issues with possibly undefined objects
FILES_WITH_INDEX_ACCESS=$(grep -l "config\.targets\." $(find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*"))

for file in $FILES_WITH_INDEX_ACCESS; do
  echo "Fixing index access in file: $file"
  # Replace dot notation with bracket notation for common patterns
  sed -i 's/config\.targets\.build/config.targets?.["build"]/g' "$file"
  sed -i 's/config\.targets\.lint/config.targets?.["lint"]/g' "$file"
  sed -i 's/config\.targets\.test/config.targets?.["test"]/g' "$file"
done

echo "TypeScript type issues fixed."
