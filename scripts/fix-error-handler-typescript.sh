#!/bin/bash

# Script to fix TypeScript error-handler module issues

echo "Fixing TypeScript error-handler module issues..."

# Fix specific file with remaining issues
ERROR_HANDLER_FILE="/home/g_nelson/signals-1/libs/utils/monitoring/src/lib/error-handler.ts"

echo "Fixing file: $ERROR_HANDLER_FILE"

# Fix type annotations in error-handler.ts
sed -i 's/\([a-zA-Z0-9]\+\) || undefined/\1 | undefined/g' "$ERROR_HANDLER_FILE"

# Fix Record<string, unknown> || undefined
sed -i 's/Record<string, unknown> || undefined/Record<string, unknown> | undefined/g' "$ERROR_HANDLER_FILE"

# Fix more specific type issues
sed -i 's/number || undefined/number | undefined/g' "$ERROR_HANDLER_FILE"
sed -i 's/string || undefined/string | undefined/g' "$ERROR_HANDLER_FILE"
sed -i 's/Error || undefined/Error | undefined/g' "$ERROR_HANDLER_FILE"

# Fix issues in otel-config.ts
OTEL_CONFIG_FILE="/home/g_nelson/signals-1/libs/utils/monitoring/src/lib/otel-config.ts"
echo "Fixing file: $OTEL_CONFIG_FILE"
sed -i 's/\([a-zA-Z0-9]\+\) || undefined/\1 | undefined/g' "$OTEL_CONFIG_FILE"
sed -i 's/string || undefined/string | undefined/g' "$OTEL_CONFIG_FILE"

echo "TypeScript error-handler module issues fixed."
