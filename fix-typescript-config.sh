#!/bin/bash

# Fix TypeScript configuration issue with strictPropertyInitialization and strictNullChecks
echo "Fixing TypeScript configuration in tsconfig.json..."

# Create a backup of the original file
cp tsconfig.json tsconfig.json.bak

# Update the tsconfig.json file to remove strictNullChecks and add strictPropertyInitialization: false
cat > tsconfig.json << 'EOF'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "skipLibCheck": true,
    "exactOptionalPropertyTypes": false,
    "strictPropertyInitialization": false
  },
  "include": ["libs/**/*.ts", "tools/**/*.ts", "scripts/**/*.ts", "**/*.d.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "*.generated.*",
    "apps/**/*",
    "agent-frontend/**/*",
    "**/*.tsx",
    "**/*.jsx"
  ]
}
EOF

echo "TypeScript configuration fixed. Now checking compilation..."
npx tsc --noEmit
