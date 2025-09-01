#!/bin/bash

# Script to fix nx-integration.ts file issues

echo "Fixing TypeScript nx-integration.ts issues..."

# Fix specific file with syntax problems
NX_INTEGRATION_FILE="/home/g_nelson/signals-1/libs/utils/signals/src/nx-integration.ts"

echo "Fixing file: $NX_INTEGRATION_FILE"

# Create a backup of the original file
cp "$NX_INTEGRATION_FILE" "${NX_INTEGRATION_FILE}.bak"

# Fix the specific issue with the comma
sed -i 's/}) as T);/}) as T);/g' "$NX_INTEGRATION_FILE"
sed -i 's/    }/    };/g' "$NX_INTEGRATION_FILE"

echo "Fixed TypeScript nx-integration.ts issues."
