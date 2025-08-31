#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/mcp-config.json"
LOG_FILE="$SCRIPT_DIR/logs/mcp-server.log"

# Check if the config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: MCP configuration file not found at $CONFIG_FILE"
  exit 1
fi

# Ensure the logs directory exists
mkdir -p "$SCRIPT_DIR/logs"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required but not installed"
  exit 1
fi

# Start the custom MCP server
echo "Starting Codacy MCP server with configuration: $CONFIG_FILE"
echo "Logs will be written to: $LOG_FILE"

# Run the server using nohup to keep it running in the background
nohup node "$SCRIPT_DIR/mcp-server.js" "$CONFIG_FILE" > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Print information about the server
echo "MCP server started with PID $SERVER_PID"
echo "Configuration: $CONFIG_FILE"
echo "Log file: $LOG_FILE"

# Wait a moment for the server to start
sleep 2

# Check if the server is running
if ps -p $SERVER_PID > /dev/null; then
  echo "Server started successfully!"
  echo "Test the server with: curl http://localhost:$(grep -o '"port":[^,]*' "$CONFIG_FILE" | cut -d: -f2 | tr -d ' ')/health"
else
  echo "Failed to start the server. Check the logs at $LOG_FILE"
  exit 1
fi
