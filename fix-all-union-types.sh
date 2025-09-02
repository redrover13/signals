#!/bin/bash

# This script fixes the "|| undefined" vs "| undefined" issue in type declarations
# It finds all TypeScript files and replaces incorrect syntax

echo "Starting comprehensive fix for union types in TypeScript files..."

# Fix all TypeScript files in the project
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read -r file; do
  echo "Processing $file..."

  # Fix all variants of "Type || undefined" to "Type | undefined" in type declarations
  sed -i 's/: \([a-zA-Z0-9]\+\) || undefined/: \1 | undefined/g' "$file"
  sed -i 's/: \([a-zA-Z0-9]\+\)<\([^>]*\)> || undefined/: \1<\2> | undefined/g' "$file"
  sed -i 's/: \([a-zA-Z0-9]\+\)\[\] || undefined/: \1[] | undefined/g' "$file"
  
  # Fix common types
  sed -i 's/: Record<string, unknown> || undefined/: Record<string, unknown> | undefined/g' "$file"
  sed -i 's/: Record<string, any> || undefined/: Record<string, any> | undefined/g' "$file"
  sed -i 's/: Record<string, string> || undefined/: Record<string, string> | undefined/g' "$file"
  sed -i 's/: number || undefined/: number | undefined/g' "$file"
  sed -i 's/: string || undefined/: string | undefined/g' "$file"
  sed -i 's/: boolean || undefined/: boolean | undefined/g' "$file"
  sed -i 's/: any || undefined/: any | undefined/g' "$file"
  sed -i 's/: void || undefined/: void | undefined/g' "$file"
  sed -i 's/: Error || undefined/: Error | undefined/g' "$file"
  sed -i 's/: unknown || undefined/: unknown | undefined/g' "$file"
  sed -i 's/: Date || undefined/: Date | undefined/g' "$file"
  
  # Fix array types
  sed -i 's/: string\[\] || undefined/: string[] | undefined/g' "$file"
  sed -i 's/: number\[\] || undefined/: number[] | undefined/g' "$file"
  sed -i 's/: boolean\[\] || undefined/: boolean[] | undefined/g' "$file"
  sed -i 's/: any\[\] || undefined/: any[] | undefined/g' "$file"
  
  # Fix specific custom types that we've seen in the codebase
  sed -i 's/: ServerHealthStats || undefined/: ServerHealthStats | undefined/g' "$file"
  sed -i 's/: MCPClientService || undefined/: MCPClientService | undefined/g' "$file"
  sed -i 's/: MCPServerConfig || undefined/: MCPServerConfig | undefined/g' "$file"
  sed -i 's/: MCPServerConnection || undefined/: MCPServerConnection | undefined/g' "$file"
  sed -i 's/: GoogleAuth || undefined/: GoogleAuth | undefined/g' "$file"
  sed -i 's/: UnknownRecord || undefined/: UnknownRecord | undefined/g' "$file"
  sed -i 's/: BasicMCPMetrics || undefined/: BasicMCPMetrics | undefined/g' "$file"
  
  # Fix Promise return types
  sed -i 's/Promise<\([^>]*\) || undefined>/Promise<\1 | undefined>/g' "$file"
  
  # Fix type parameters with unions
  sed -i 's/<\([^>]*\) || undefined>/<\1 | undefined>/g' "$file"
  
  # Fix function return types
  sed -i 's/): \([a-zA-Z0-9]\+\) || undefined/): \1 | undefined/g' "$file"
  sed -i 's/): Promise<\([^>]*\) || undefined>/): Promise<\1 | undefined>/g' "$file"
  
  echo "Completed processing $file."
done

echo "Fixing special cases that may not be caught by the general patterns..."

# Fix specific files with known issues
FILES_TO_FIX=(
  "/home/g_nelson/signals-1/libs/utils/signals/src/index.ts"
  "/home/g_nelson/signals-1/libs/utils/signals/index.ts"
  "/home/g_nelson/signals-1/scripts/demo-opentelemetry.ts"
)

for file in "${FILES_TO_FIX[@]}"; do
  if [ -f "$file" ]; then
    echo "Applying special fixes to $file..."
    # Fix specific value expressions (not type declarations)
    # These are special cases where we need || instead of | in the expressions
    sed -i 's/storedValue = item ? JSON.parse(item) : initialValue | undefined;/storedValue = item ? JSON.parse(item) : initialValue || undefined;/g' "$file"
    echo "Completed special fixes for $file."
  fi
done

echo "All TypeScript files have been processed."
echo "You may still need to manually fix some specific cases."
echo "Run TypeScript compiler to check for remaining errors:"
echo "npx tsc --noEmit"
