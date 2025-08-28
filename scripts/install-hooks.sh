#!/bin/bash

# Script to install git hooks

echo "Installing git hooks..."

# Get the git hooks directory
HOOKS_DIR=$(git rev-parse --git-dir)/hooks

# Create the directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Copy the pre-commit hook
cp .github/hooks/pre-commit "$HOOKS_DIR/pre-commit"

# Make the hook executable
chmod +x "$HOOKS_DIR/pre-commit"

echo "Git hooks installed successfully."
