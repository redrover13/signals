#!/bin/bash

# Fix Signals Index Errors - Comprehensive Version

echo "Fixing TypeScript errors in signals/index.ts (comprehensive)..."

# Path to the file with errors
FILE_PATH="/home/g_nelson/signals-1/libs/utils/signals/index.ts"

# Create a backup
cp "$FILE_PATH" "${FILE_PATH}.comprehensive.bak"

# Save a copy of the original for comparison
cp "$FILE_PATH" "${FILE_PATH}.original"

# Let's check if the file exists first
if [ ! -f "$FILE_PATH" ]; then
  # If the index.ts doesn't exist, try src/index.ts
  FILE_PATH="/home/g_nelson/signals-1/libs/utils/signals/src/index.ts"
  
  # Create backups of this file instead
  cp "$FILE_PATH" "${FILE_PATH}.comprehensive.bak"
  cp "$FILE_PATH" "${FILE_PATH}.original"
fi

# Now let's fix the return statement in the derive function
sed -i 's/  (): T => derivedValue(),/  return derivedValue;/g' "$FILE_PATH"

echo "Fixed TypeScript errors in signals/index.ts (comprehensive)."
