#!/bin/bash

# Script to fix errors in the signals TypeScript files

echo "Fixing errors in signals TypeScript files..."

# Fix the logical OR vs type union confusion in type declarations
find /home/g_nelson/signals-1/libs/utils/signals -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
  # First, create a backup
  cp "$file" "${file}.bak"
  
  # Fix the expression errors with initialValue | undefined
  sed -i 's/initialValue | undefined/initialValue || undefined/g' "$file"
  
  # Fix the type annotations that use || where they should use |
  sed -i 's/boolean || undefined/boolean | undefined/g' "$file"
  sed -i 's/string || undefined/string | undefined/g' "$file"
  sed -i 's/number || undefined/number | undefined/g' "$file"
  sed -i 's/Error || undefined/Error | undefined/g' "$file"
  sed -i 's/void || undefined/void | undefined/g' "$file"
  sed -i 's/any || undefined/any | undefined/g' "$file"
  
  # Fix T | undefined not assignable to T issues with type assertions
  sed -i 's/return \[value, signal.set\];/return [value as T, signal.set];/g' "$file"
  sed -i 's/signal.set(selector(store.getState()));/signal.set(selector(store.getState()) as T);/g' "$file"
done

echo "Fixed errors in signals TypeScript files."
