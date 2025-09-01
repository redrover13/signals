#!/bin/bash

# Fix API Clients Errors

echo "Fixing TypeScript errors in API clients..."

# Path to the file with errors
FILE_PATH="/home/g_nelson/signals-1/libs/utils/api-clients/src/lib/request-router.service.ts"

# Create a backup
cp "$FILE_PATH" "${FILE_PATH}.bak"

# Fix logical operators vs. type unions in type declarations
# Replace the logical AND operators in property access with proper syntax
sed -i 's/this && this\./this./g' "$FILE_PATH"

# Fix spread syntax errors
sed -i 's/\[...this && ...this.routingRules\]/[...this.routingRules]/g' "$FILE_PATH"

echo "Fixed TypeScript errors in API clients"
