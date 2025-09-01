#!/bin/bash

# Script to fix mcp-utils.ts file issues

echo "Fixing TypeScript mcp-utils.ts issues..."

# Fix specific file with syntax problems
MCP_UTILS_FILE="/home/g_nelson/signals-1/libs/utils/monitoring/src/lib/mcp-utils.ts"

echo "Fixing file: $MCP_UTILS_FILE"

# Create a backup of the original file
cp "$MCP_UTILS_FILE" "${MCP_UTILS_FILE}.bak"

# Fix the specific issues in mcp-utils.ts
sed -i 's/details: BasicMCPMetrics || undefined;/details: BasicMCPMetrics | undefined;/g' "$MCP_UTILS_FILE"

# Fix the closing braces specifically
sed -i '57s/}) {/}) {/' "$MCP_UTILS_FILE"
sed -i '110s/}) {/}) {/' "$MCP_UTILS_FILE"
sed -i '194s/}) {/}) {/' "$MCP_UTILS_FILE"

echo "Fixed TypeScript mcp-utils.ts issues."
