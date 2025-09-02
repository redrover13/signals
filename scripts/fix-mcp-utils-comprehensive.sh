#!/bin/bash

# Script to fix mcp-utils.ts file issues comprehensively

echo "Fixing TypeScript mcp-utils.ts issues (comprehensive)..."

# Fix specific file with syntax problems
MCP_UTILS_FILE="/home/g_nelson/signals-1/libs/utils/monitoring/src/lib/mcp-utils.ts"

echo "Fixing file: $MCP_UTILS_FILE"

# Create a backup of the original file
cp "$MCP_UTILS_FILE" "${MCP_UTILS_FILE}.bak.comprehensive"

# Fix the specific syntax issues
# Fix the braces at specific line numbers
sed -i '57s/}) {/}) {/' "$MCP_UTILS_FILE"
sed -i '110s/}) {/}) {/' "$MCP_UTILS_FILE"
sed -i '194s/}) {/}) {/' "$MCP_UTILS_FILE"

echo "Fixed TypeScript mcp-utils.ts issues (comprehensive)."
