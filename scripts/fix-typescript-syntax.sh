#!/bin/bash

# Script to fix TypeScript syntax errors

echo "Fixing TypeScript syntax errors..."

# Create a file to store files with syntax errors
TEMP_FILE=$(mktemp)

# Fix comma syntax errors (", | undefined" -> " | undefined")
grep -l ", | undefined" $(find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*") > "$TEMP_FILE"

for file in $(cat "$TEMP_FILE"); do
  echo "Fixing comma syntax in file: $file"
  sed -i 's/, | undefined/ | undefined/g' "$file"
done

# Restore type annotations where we might have incorrectly modified them
# Find files with syntax errors from our previous fixes
grep -l " || undefined;" $(find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*") > "$TEMP_FILE"

for file in $(cat "$TEMP_FILE"); do
  echo "Fixing type annotations in file: $file"
  # Fix type annotations where we incorrectly replaced | with ||
  sed -i 's/: \([a-zA-Z0-9]*\) || undefined;/: \1 | undefined;/g' "$file"
  sed -i 's/: \([a-zA-Z0-9]*\)\[\] || undefined;/: \1[] | undefined;/g' "$file"
  sed -i 's/: \([a-zA-Z0-9]*\)<\([^>]*\)> || undefined;/: \1<\2> | undefined;/g' "$file"
done

# Clean up temporary file
rm "$TEMP_FILE"

echo "TypeScript syntax errors fixed."
