#!/bin/bash

# Fixed Codacy CLI Wrapper Script
# This script bypasses the GitHub API call and uses a known working version

# Set the Codacy CLI version explicitly
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure logs directory exists
mkdir -p "$SCRIPT_DIR/logs"

# Run the Codacy CLI with the correct version
bash <(curl -Ls https://raw.githubusercontent.com/codacy/codacy-cli-v2/main/codacy-cli.sh) "$@" | tee "$SCRIPT_DIR/logs/codacy-fixed.log"

# Store the exit code
EXIT_CODE=${PIPESTATUS[0]}

# Output informative message
if [ $EXIT_CODE -eq 0 ]; then
  echo "Codacy CLI command completed successfully!"
else
  echo "Codacy CLI command failed with exit code $EXIT_CODE"
  echo "Check logs at $SCRIPT_DIR/logs/codacy-fixed.log for details"
fi

exit $EXIT_CODE
