#!/bin/bash

# Script to fix common-types and gcp-auth TypeScript issues

echo "Fixing TypeScript common-types and gcp-auth issues..."

# Fix common-types/src/index.ts
COMMON_TYPES_FILE="/home/g_nelson/signals-1/libs/utils/common-types/src/index.ts"
echo "Fixing file: $COMMON_TYPES_FILE"
# Create a backup of the original file
cp "$COMMON_TYPES_FILE" "${COMMON_TYPES_FILE}.bak"
# Fix E || undefined
sed -i 's/E || undefined/E | undefined/g' "$COMMON_TYPES_FILE"
# Fix UnknownRecord || undefined
sed -i 's/UnknownRecord || undefined/UnknownRecord | undefined/g' "$COMMON_TYPES_FILE"

# Fix gcp-auth/src/index.ts
GCP_AUTH_FILE="/home/g_nelson/signals-1/libs/utils/gcp-auth/src/index.ts"
echo "Fixing file: $GCP_AUTH_FILE"
# Create a backup of the original file
cp "$GCP_AUTH_FILE" "${GCP_AUTH_FILE}.bak"
# Fix GoogleAuth || undefined
sed -i 's/GoogleAuth || undefined/GoogleAuth | undefined/g' "$GCP_AUTH_FILE"
# Fix Record<string, unknown> || undefined
sed -i 's/Record<string, unknown> || undefined/Record<string, unknown> | undefined/g' "$GCP_AUTH_FILE"

echo "Fixed TypeScript common-types and gcp-auth issues."
