#!/bin/bash

# Script to fix MCP server-health.service.ts file issues

echo "Fixing TypeScript MCP server-health.service.ts issues..."

# Fix specific file with syntax problems
MCP_SERVER_HEALTH_FILE="/home/g_nelson/signals-1/libs/mcp/src/lib/clients/server-health.service.ts"

echo "Fixing file: $MCP_SERVER_HEALTH_FILE"

# Create a backup of the original file
cp "$MCP_SERVER_HEALTH_FILE" "${MCP_SERVER_HEALTH_FILE}.bak"

# Fix the ServerHealthStats || undefined
sed -i 's/ServerHealthStats || undefined/ServerHealthStats | undefined/g' "$MCP_SERVER_HEALTH_FILE"

echo "Fixed TypeScript MCP server-health.service.ts issues."
