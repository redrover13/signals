#!/bin/bash

# Script to fix all remaining TypeScript union type issues

echo "Fixing all remaining TypeScript union type issues..."

# Get list of all TypeScript files with errors
FILES_WITH_ERRORS=$(find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*")

for file in $FILES_WITH_ERRORS; do
  echo "Fixing file: $file"
  
  # Fix all variants of "Type || undefined" to "Type | undefined" in type annotations
  sed -i 's/\([a-zA-Z0-9]\+\) || undefined/\1 | undefined/g' "$file"
  sed -i 's/\([a-zA-Z0-9]\+\)<\([^>]*\)> || undefined/\1<\2> | undefined/g' "$file"
  
  # Fix more specific patterns
  sed -i 's/Record<string, unknown> || undefined/Record<string, unknown> | undefined/g' "$file"
  sed -i 's/Record<string, any> || undefined/Record<string, any> | undefined/g' "$file"
  sed -i 's/Record<string, string> || undefined/Record<string, string> | undefined/g' "$file"
  sed -i 's/number || undefined/number | undefined/g' "$file"
  sed -i 's/string || undefined/string | undefined/g' "$file"
  sed -i 's/boolean || undefined/boolean | undefined/g' "$file"
  sed -i 's/any || undefined/any | undefined/g' "$file"
  sed -i 's/void || undefined/void | undefined/g' "$file"
  sed -i 's/Error || undefined/Error | undefined/g' "$file"
  sed -i 's/unknown || undefined/unknown | undefined/g' "$file"
  
  # Fix string array union types
  sed -i 's/string\[\] || undefined/string[] | undefined/g' "$file"
done

echo "All remaining TypeScript union type issues fixed."
