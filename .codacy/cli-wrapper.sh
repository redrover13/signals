#!/bin/bash

# Set the Codacy CLI version explicitly
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Call the original CLI script with all arguments
"$SCRIPT_DIR/cli.sh" "$@"
