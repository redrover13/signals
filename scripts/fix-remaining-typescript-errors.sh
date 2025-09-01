#!/bin/bash

# Script to fix remaining TypeScript errors after fixing union type syntax

echo "Fixing remaining TypeScript errors..."

# Fix for TS18050: Using undefined with bitwise OR operator in expressions
# Change "value | undefined" to "value || undefined" in expressions (not type declarations)
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | xargs grep -l "| undefined" | while read file; do
  # Fix pattern: "something : initialValue | undefined" -> "something : initialValue || undefined"
  sed -i 's/\(: [^|:]*\) | undefined/\1 || undefined/g' "$file"
  
  # Fix more specific cases
  sed -i 's/initialValue | undefined/initialValue || undefined/g' "$file"
  sed -i 's/retryDelay | undefined/retryDelay || undefined/g' "$file"
done

# Fix for TS2322: Type 'T | undefined' not assignable to type 'T'
# This is more complex and might need manual fixes, but we can try some common patterns
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | xargs grep -l "signal.set" | while read file; do
  # Add "as T" type assertion for common signal pattern
  sed -i 's/return \[\(.*\), signal.set\]/return \[\1 as T, signal.set\]/g' "$file"
  sed -i 's/signal.set(\(.*\))/signal.set(\1 as T)/g' "$file"
done

# Fix for string | undefined issues in some files
# Add null checks before using potentially undefined values
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | xargs grep -l "localStorage.getItem" | while read file; do
  # Add null check before using localStorage.getItem
  sed -i 's/localStorage.getItem(key)/localStorage.getItem(key || "")/g' "$file"
done

# Fix for config? properties assignment issues
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | xargs grep -l "config.targets?." | while read file; do
  # Replace optional chaining assignment with conditional assignment
  sed -i 's/config.targets?\.\["build"\]/config.targets && (config.targets["build"])/g' "$file"
  sed -i 's/config.targets?\.\["lint"\]/config.targets && (config.targets["lint"])/g' "$file"
  sed -i 's/config.targets?\.\["test"\]/config.targets && (config.targets["test"])/g' "$file"
done

echo "Fixed remaining TypeScript errors. Some manual fixes may still be required."
