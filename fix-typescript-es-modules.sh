#!/bin/bash

# Main script to fix all TypeScript errors after migrating to ES modules with lodash-es

echo "Starting comprehensive fix for TypeScript errors..."

# Make all fix scripts executable
chmod +x /home/g_nelson/signals-1/fix-performance-metrics.sh
chmod +x /home/g_nelson/signals-1/fix-security-module.sh
chmod +x /home/g_nelson/signals-1/fix-api-clients.sh
chmod +x /home/g_nelson/signals-1/fix-signals-module.sh

# Run all fix scripts
/home/g_nelson/signals-1/fix-performance-metrics.sh
/home/g_nelson/signals-1/fix-security-module.sh
/home/g_nelson/signals-1/fix-api-clients.sh
/home/g_nelson/signals-1/fix-signals-module.sh

# Generic fix for logical operators vs. type unions in type declarations across all files
echo "Applying generic fixes across all TypeScript files..."

# Find all TypeScript files and fix common patterns
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
  # Fix logical operators in property access
  sed -i 's/this && this\./this./g' "$file"
  sed -i 's/process && process\./process./g' "$file"
  
  # Fix spread syntax errors
  sed -i 's/{ .. && ...DEFAULT_/{ ...DEFAULT_/g' "$file"
  sed -i 's/, .. && ...config/, ...config/g' "$file"
  
  # Fix union types syntax (using | instead of ||)
  sed -i 's/\([a-zA-Z0-9]\+\) || undefined/\1 | undefined/g' "$file"
  sed -i 's/\([a-zA-Z0-9]\+\)<\([^>]*\)> || undefined/\1<\2> | undefined/g' "$file"
  
  # Fix more specific union type patterns
  sed -i 's/Record<string, unknown> || undefined/Record<string, unknown> | undefined/g' "$file"
  sed -i 's/Record<string, any> || undefined/Record<string, any> | undefined/g' "$file"
  sed -i 's/Record<string, string> || undefined/Record<string, string> | undefined/g' "$file"
  sed -i 's/string\[\] || undefined/string[] | undefined/g' "$file"
  
  # Fix specific type issues
  sed -i 's/schema: z && z\.ZodSchema/schema: z.ZodSchema/g' "$file"
  
  # Fix object spread syntax
  sed -i 's/\[...this && ...this\./[...this./g' "$file"
  sed -i 's/\{...data && ...data\./\{...data./g' "$file"
done

echo "All TypeScript fixes applied. Running TypeScript check..."

# Run TypeScript check to verify fixes
cd /home/g_nelson/signals-1 && pnpm ts:check

echo "Fix script complete."
