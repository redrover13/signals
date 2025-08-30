#!/bin/bash

# Set error handling
set -e

# Define paths
ROOT_PATH="$1"
FILE_PATH="$2"
TOOL="$3"
OUTPUT_FILE="/tmp/codacy_output.json"

# Change to the root directory
cd "$ROOT_PATH"

# Create a wrapper function to capture and format the output
run_codacy() {
  local cmd=""
  
  if [ -n "$FILE_PATH" ] && [ -n "$TOOL" ]; then
    cmd=".codacy/cli.sh analyze $FILE_PATH --tool $TOOL --format json"
  elif [ -n "$FILE_PATH" ]; then
    cmd=".codacy/cli.sh analyze $FILE_PATH --format json"
  elif [ -n "$TOOL" ]; then
    cmd=".codacy/cli.sh analyze --tool $TOOL --format json"
  else
    cmd=".codacy/cli.sh analyze --format json"
  fi
  
  echo "Running: $cmd"
  
  # Run the command and capture output
  output=$(eval "$cmd" 2>&1) || {
    # If command fails, create a properly formatted error JSON
    error_code=$?
    echo "{\"success\": false, \"error_code\": $error_code, \"output\": \"Command failed: $cmd\"}" > "$OUTPUT_FILE"
    return 1
  }
  
  # Create a properly formatted JSON output
  echo "{\"success\": true, \"output\": $(echo "$output" | jq -R -s '.')}" > "$OUTPUT_FILE"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "{\"success\": false, \"output\": \"jq is not installed. Please install jq to format JSON output properly.\"}" > "$OUTPUT_FILE"
  exit 1
fi

# Run Codacy and capture output
run_codacy || true

# Print the output file
cat "$OUTPUT_FILE"
