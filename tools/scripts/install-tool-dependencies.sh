#!/bin/bash

# Script to install dependencies needed for the monorepo tools

echo "Installing dependencies for monorepo tools..."

# Make sure we're in the root directory
cd "$(dirname "$0")/../.."

# Install glob for file pattern matching
pnpm add glob @types/glob --save-dev

# Install typescript if not already installed
if ! pnpm list typescript > /dev/null 2>&1; then
  pnpm add typescript --save-dev
fi

echo "Dependencies installed successfully!"
