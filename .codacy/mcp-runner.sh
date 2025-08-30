#!/bin/bash
# This script is used by the Codacy MCP server
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/codacy-fixed.sh" "$@"
