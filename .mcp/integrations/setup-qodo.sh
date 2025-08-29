#!/bin/bash
# Qodo Gen MCP Integration Script
echo "🔧 Configuring Qodo Gen for MCP access..."

# Ensure Qodo settings directory exists
mkdir -p "$HOME/.qodo"
mkdir -p "$HOME/.codegpt"

# Copy MCP configuration with Qodo-specific adaptations
cp "/home/g_nelson/signals-1/.mcp/config/mcp.json" "$HOME/.qodo/mcp.json"
cp "/home/g_nelson/signals-1/.mcp/config/mcp.json" "$HOME/.codegpt/mcp_config.json"

# Set permissions
chmod 644 "$HOME/.qodo/mcp.json"
chmod 644 "$HOME/.codegpt/mcp_config.json"

echo "✅ Qodo Gen MCP integration configured"
