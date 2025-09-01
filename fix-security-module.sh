#!/bin/bash

# Fix Security Module Errors

echo "Fixing TypeScript errors in security module..."

# Path to the file with errors
INDEX_FILE="/home/g_nelson/signals-1/libs/security/src/index.ts"
SECRET_MANAGER_FILE="/home/g_nelson/signals-1/libs/security/src/secret-manager.ts"

# Create backups
cp "$INDEX_FILE" "${INDEX_FILE}.bak"
cp "$SECRET_MANAGER_FILE" "${SECRET_MANAGER_FILE}.bak"

# Fix logical operators vs. type unions in type declarations
# Replace the logical AND operators in property access with proper syntax
sed -i 's/this && this\./this./g' "$SECRET_MANAGER_FILE"
sed -i 's/request && request\./request./g' "$INDEX_FILE"

# Fix spread syntax errors (.. && ... pattern)
sed -i 's/{ .. && ...DEFAULT_SECURITY_CONFIG, .. && ...config }/{ ...DEFAULT_SECURITY_CONFIG, ...config }/g' "$INDEX_FILE"

# Fix type declaration syntax
sed -i 's/schema: z && z\.ZodSchema<T>/schema: z.ZodSchema<T>/g' "$INDEX_FILE"

# Fix issues with optional chaining and logical operators
sed -i 's/result?.error.issues && .error.issues/result?.error?.issues/g' "$INDEX_FILE"

echo "Fixed TypeScript errors in security module"
