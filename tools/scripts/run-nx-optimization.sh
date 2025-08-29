#!/bin/bash

# Script to set up and run the NX monorepo optimization

echo "Starting NX monorepo optimization..."

# Make sure we're in the root directory
cd "$(dirname "$0")/.."

# Install required dependencies
echo "Installing required dependencies..."
pnpm add glob @types/glob typescript @types/typescript --save-dev

# Install ESLint plugins if needed
if ! pnpm list @typescript-eslint/eslint-plugin > /dev/null 2>&1; then
  echo "Installing ESLint plugins..."
  pnpm add @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
fi

# Run the update scripts
echo "Updating project configurations..."
npx ts-node tools/scripts/update-project-configs.ts

echo "Checking for TypeScript issues..."
npx ts-node tools/scripts/check-typescript-issues.ts

echo "Analyzing dependencies..."
npx ts-node tools/scripts/analyze-dependencies.ts

# Run NX commands to validate changes
echo "Running NX commands to validate changes..."
npx nx format:write

echo "NX monorepo optimization complete!"
echo "Check the generated reports for any issues that need to be addressed."
