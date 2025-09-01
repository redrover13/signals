#!/bin/bash

# Script to fix all type annotations using || instead of |

echo "Fixing type annotations in all TypeScript files..."

# Find all TypeScript files
TS_FILES=$(find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*")

for file in $TS_FILES; do
  echo "Processing file: $file"
  
  # Fix type annotations
  sed -i 's/: string || undefined/: string | undefined/g' "$file"
  sed -i 's/: number || undefined/: number | undefined/g' "$file"
  sed -i 's/: boolean || undefined/: boolean | undefined/g' "$file"
  sed -i 's/: any || undefined/: any | undefined/g' "$file"
  sed -i 's/: void || undefined/: void | undefined/g' "$file"
  sed -i 's/: Error || undefined/: Error | undefined/g' "$file"
  sed -i 's/: unknown || undefined/: unknown | undefined/g' "$file"
  sed -i 's/: T || undefined/: T | undefined/g' "$file"
  sed -i 's/: S || undefined/: S | undefined/g' "$file"
  sed -i 's/: Record<string, any> || undefined/: Record<string, any> | undefined/g' "$file"
  sed -i 's/: Record<string, unknown> || undefined/: Record<string, unknown> | undefined/g' "$file"
  sed -i 's/: Record<string, string> || undefined/: Record<string, string> | undefined/g' "$file"
  sed -i 's/: string\[\] || undefined/: string[] | undefined/g' "$file"
  sed -i 's/: any\[\] || undefined/: any[] | undefined/g' "$file"
done

echo "Fixed type annotations in all TypeScript files."
