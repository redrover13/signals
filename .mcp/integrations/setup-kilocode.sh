#!/bin/bash
# Kilocode MCP Integration Script
echo "🔧 Configuring Kilocode for MCP access..."

# Ensure Kilocode settings directory exists
mkdir -p "$HOME/.vscode-server/data/User/globalStorage/kilocode.kilo-code/settings"

# Copy MCP configuration
cp "/home/g_nelson/signals-1/.mcp/config/mcp.json" "$HOME/.vscode-server/data/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json"

# Set permissions
chmod 644 "$HOME/.vscode-server/data/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json"

echo "✅ Kilocode MCP integration configured"
