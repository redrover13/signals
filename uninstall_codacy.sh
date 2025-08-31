#!/bin/bash

echo "=== Starting complete Codacy CLI uninstallation ==="

# Remove binaries
echo "Removing Codacy binaries..."
rm -f ~/.local/bin/codacy-cli-v2
rm -f ~/.local/bin/codacy-cli
rm -f ~/.local/bin/codacy

# Remove cache directory
echo "Removing Codacy cache..."
rm -rf ~/.cache/codacy

# Remove .codacy directory in home
echo "Removing .codacy configuration directory in home..."
rm -rf ~/.codacy

# Remove project-specific .codacy directories
echo "Removing project-specific .codacy directories..."
rm -rf ~/signals-1/.codacy
rm -rf ~/signals-1/codacy-test-output

# Remove environment variables
echo "Removing environment variables..."
if grep -q "CODACY_CLI" ~/.bashrc; then
    sed -i '/CODACY_CLI/d' ~/.bashrc
fi

# Remove any temporary files
echo "Removing temporary SARIF files..."
rm -f ~/signals-1/codacy-test*.sarif

# Remove any aliases
echo "Removing any Codacy aliases..."
if grep -q "alias codacy" ~/.bashrc; then
    sed -i '/alias codacy/d' ~/.bashrc
fi

echo "=== Codacy CLI uninstallation complete ==="
