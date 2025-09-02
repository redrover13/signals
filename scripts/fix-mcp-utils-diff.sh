#!/bin/bash

# Script to fix mcp-utils.ts file issues with a different approach

echo "Fixing TypeScript mcp-utils.ts issues (with a different approach)..."

# Fix specific file with syntax problems
MCP_UTILS_FILE="/home/g_nelson/signals-1/libs/utils/monitoring/src/lib/mcp-utils.ts"

echo "Fixing file: $MCP_UTILS_FILE"

# Create a backup of the original file
cp "$MCP_UTILS_FILE" "${MCP_UTILS_FILE}.bak.diff"

# Replace the entire function definition
sed -i 's/export function getMCPServerRecommendations(useCase: string): {/export function getMCPServerRecommendations(useCase: string): {/' "$MCP_UTILS_FILE"
sed -i 's/  essential: string\[\];/  essential: string\[\];/' "$MCP_UTILS_FILE"
sed -i 's/  recommended: string\[\];/  recommended: string\[\];/' "$MCP_UTILS_FILE"
sed -i 's/  optional: string\[\];/  optional: string\[\];/' "$MCP_UTILS_FILE"
sed -i 's/}) {/} {/' "$MCP_UTILS_FILE"

# Fix the other functions in a similar way
sed -i 's/export function getMCPServerOverrides(override: string): {/export function getMCPServerOverrides(override: string): {/' "$MCP_UTILS_FILE"
sed -i 's/  include: string\[\];/  include: string\[\];/' "$MCP_UTILS_FILE"
sed -i 's/  exclude: string\[\];/  exclude: string\[\];/' "$MCP_UTILS_FILE"
sed -i 's/}) {/} {/' "$MCP_UTILS_FILE"

sed -i 's/export function optimizeMCPServerList(servers: string\[\], options: {/export function optimizeMCPServerList(servers: string\[\], options: {/' "$MCP_UTILS_FILE"
sed -i 's/  useCase?: string;/  useCase?: string;/' "$MCP_UTILS_FILE"
sed -i 's/  override?: string;/  override?: string;/' "$MCP_UTILS_FILE"
sed -i 's/  limit?: number;/  limit?: number;/' "$MCP_UTILS_FILE"
sed -i 's/}) {/} ): string[] {/' "$MCP_UTILS_FILE"

echo "Fixed TypeScript mcp-utils.ts issues (with a different approach)."
