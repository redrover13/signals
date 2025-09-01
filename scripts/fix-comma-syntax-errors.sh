#!/bin/bash

# Script to fix TypeScript comma syntax errors
# Specifically fixing the ", | undefined" errors

echo "Fixing TypeScript comma syntax errors..."

# Use grep to find files with the pattern ', | undefined'
FILES_WITH_ERRORS=$(grep -l ", | undefined" $(find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*"))

# Create a sed command to fix the errors
for file in $FILES_WITH_ERRORS; do
  echo "Fixing file: $file"
  # Replace ", | undefined" with " | undefined"
  sed -i 's/, | undefined/ | undefined/g' "$file"
done

echo "TypeScript comma syntax errors fixed."
