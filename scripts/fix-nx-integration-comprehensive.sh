#!/bin/bash

# Script to fix nx-integration.ts file issues comprehensively

echo "Fixing TypeScript nx-integration.ts issues (comprehensive)..."

# Fix specific file with syntax problems
NX_INTEGRATION_FILE="/home/g_nelson/signals-1/libs/utils/signals/src/nx-integration.ts"

echo "Fixing file: $NX_INTEGRATION_FILE"

# Create a backup of the original file
cp "$NX_INTEGRATION_FILE" "${NX_INTEGRATION_FILE}.bak.comprehensive"

# Fix the specific syntax issues
# Remove trailing comma
sed -i 's/    };,/    },/g' "$NX_INTEGRATION_FILE"

# Fix the source.set function syntax - this is a complex fix
sed -i 's/      source.set(({/      source.set({/g' "$NX_INTEGRATION_FILE"
sed -i 's/      };) as T/      } as T)/g' "$NX_INTEGRATION_FILE"

# Fix the closing brace
sed -i 's/    };/    }/g' "$NX_INTEGRATION_FILE"

echo "Fixed TypeScript nx-integration.ts issues (comprehensive)."
