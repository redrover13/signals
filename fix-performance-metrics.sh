#!/bin/bash

# Fix Performance Metrics Service Errors

echo "Fixing TypeScript errors in performance-metrics.service.ts..."

# Path to the file with errors
FILE_PATH="/home/g_nelson/signals-1/libs/mcp/src/lib/services/performance-metrics.service.ts"

# Create a backup
cp "$FILE_PATH" "${FILE_PATH}.bak"

# Fix logical operators vs. type unions in type declarations
# Replace the logical AND operators in property access with proper syntax
sed -i 's/this && this\./this./g' "$FILE_PATH"
sed -i 's/serverGroups && serverGroups\./serverGroups./g' "$FILE_PATH"
sed -i 's/recentRequests && recentRequests\./recentRequests./g' "$FILE_PATH"
sed -i 's/this.completedRequests && this.completedRequests\./this.completedRequests./g' "$FILE_PATH"
sed -i 's/this.serverStats && this.serverStats\./this.serverStats./g' "$FILE_PATH"
sed -i 's/Date && Date\./Date./g' "$FILE_PATH"

# Fix spread syntax errors (.. && ... pattern)
sed -i 's/.. && ...baseStats/...baseStats/g' "$FILE_PATH"
sed -i 's/.. && ...config/...config/g' "$FILE_PATH"
sed -i 's/.. && ...DEFAULT_SECURITY_CONFIG/...DEFAULT_SECURITY_CONFIG/g' "$FILE_PATH"
sed -i 's/\[...this && ...this.routingRules\]/[...this.routingRules]/g' "$FILE_PATH"

# Fix type declaration syntax
sed -i 's/z && z\.ZodSchema/z.ZodSchema/g' "$FILE_PATH"

echo "Fixed TypeScript errors in performance-metrics.service.ts"
