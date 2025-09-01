#!/bin/bash

# Script to fix line endings in gemini-orchestrator.ts
FILE_PATH="/home/g_nelson/signals-1/libs/agents/gemini-orchestrator/src/lib/gemini-orchestrator.ts"
TEMP_FILE="/tmp/gemini-orchestrator-fixed.ts"

# Create a new file with proper line endings
cat "$FILE_PATH" | sed 's/\r$//' > "$TEMP_FILE"

# Replace the original file
mv "$TEMP_FILE" "$FILE_PATH"

echo "Line endings fixed in $FILE_PATH"
