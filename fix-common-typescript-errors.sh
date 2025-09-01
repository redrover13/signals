#!/bin/bash

# Fix Common TypeScript Errors - Comprehensive Version

echo "Fixing common TypeScript errors across all files (comprehensive)..."

# Find all TypeScript files and fix common patterns
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
  # Create a backup
  cp "$file" "${file}.common.bak"
  
  echo "Processing file: $file"
  
  # Fix logical operators in property access
  sed -i 's/this && this\./this./g' "$file"
  sed -i 's/process && process\./process./g' "$file"
  sed -i 's/metrics && metrics\./metrics./g' "$file"
  sed -i 's/result && result\./result./g' "$file"
  sed -i 's/request && request\./request./g' "$file"
  sed -i 's/response && response\./response./g' "$file"
  sed -i 's/config && config\./config./g' "$file"
  sed -i 's/data && data\./data./g' "$file"
  sed -i 's/client && client\./client./g' "$file"
  sed -i 's/server && server\./server./g' "$file"
  sed -i 's/Date && Date\./Date./g' "$file"
  sed -i 's/localStorage && localStorage\./localStorage./g' "$file"
  sed -i 's/window && window\./window./g' "$file"
  sed -i 's/document && document\./document./g' "$file"
  sed -i 's/z && z\./z./g' "$file"
  
  # Fix array logical operators
  sed -i 's/serverGroups && serverGroups\./serverGroups./g' "$file"
  sed -i 's/recentRequests && recentRequests\./recentRequests./g' "$file"
  sed -i 's/completedRequests && completedRequests\./completedRequests./g' "$file"
  sed -i 's/activeRequests && activeRequests\./activeRequests./g' "$file"
  sed -i 's/serverStats && serverStats\./serverStats./g' "$file"
  sed -i 's/routingRules && routingRules\./routingRules./g' "$file"
  
  # Fix spread syntax errors
  sed -i 's/\.\. && \.\.\./\.\.\./g' "$file"
  sed -i 's/\[\.\.\.(this && this\./\[\.\.\.(this\./g' "$file"
  sed -i 's/\{\.\.\.(data && data\./\{\.\.\.(data\./g' "$file"
  sed -i 's/\{\.\.\.(config && config\./\{\.\.\.(config\./g' "$file"
  
  # Fix union types syntax (using | instead of ||)
  sed -i 's/\([a-zA-Z0-9]\+\) || undefined/\1 | undefined/g' "$file"
  sed -i 's/\([a-zA-Z0-9]\+\)<\([^>]*\)> || undefined/\1<\2> | undefined/g' "$file"
  sed -i 's/\([a-zA-Z0-9]\+\)\[\] || undefined/\1[] | undefined/g' "$file"
  
  # Fix more specific union type patterns
  sed -i 's/Record<string, unknown> || undefined/Record<string, unknown> | undefined/g' "$file"
  sed -i 's/Record<string, any> || undefined/Record<string, any> | undefined/g' "$file"
  sed -i 's/Record<string, string> || undefined/Record<string, string> | undefined/g' "$file"
  sed -i 's/Promise<\([^>]*\)> || undefined/Promise<\1> | undefined/g' "$file"
  sed -i 's/Map<\([^>]*\)> || undefined/Map<\1> | undefined/g' "$file"
  sed -i 's/Array<\([^>]*\)> || undefined/Array<\1> | undefined/g' "$file"
  
  # Fix null checks
  sed -i 's/\([a-zA-Z0-9.]*\) && \1 === null/\1 === null/g' "$file"
  sed -i 's/\([a-zA-Z0-9.]*\) && \1 === undefined/\1 === undefined/g' "$file"
  sed -i 's/\([a-zA-Z0-9.]*\) && \1 !== null/\1 !== null/g' "$file"
  sed -i 's/\([a-zA-Z0-9.]*\) && \1 !== undefined/\1 !== undefined/g' "$file"
  
  # Fix optional chaining and null checks
  sed -i 's/result?.error.issues && .error.issues/result?.error?.issues/g' "$file"
  
  # Add proper type assertions to ensure type safety
  sed -i 's/return \[value, signal.set\];/return [value as T, signal.set];/g' "$file"
  sed -i 's/signal.set(selector(store.getState()));/signal.set(selector(store.getState()) as T);/g' "$file"
  
  echo "Completed processing file: $file"
done

echo "Fixed common TypeScript errors across all files (comprehensive)."
