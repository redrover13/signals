#!/bin/bash

# Fix monitoring module TypeScript issues

echo "Fixing TypeScript issues in monitoring files..."

MONITORING_INDEX="/home/g_nelson/signals-1/libs/utils/monitoring/src/index.ts"
cp "$MONITORING_INDEX" "${MONITORING_INDEX}.bak"

# Fix object possibly undefined issues
sed -i 's/if (event.payload)/if (event?.payload)/g' "$MONITORING_INDEX"
sed -i 's/if (event.type)/if (event?.type)/g' "$MONITORING_INDEX"
sed -i 's/event.type/event?.type/g' "$MONITORING_INDEX"
sed -i 's/event.payload/event?.payload/g' "$MONITORING_INDEX"

# Fix type assertions where needed
sed -i 's/return defaultValue;/return defaultValue as T;/g' "$MONITORING_INDEX"
sed -i 's/return undefined;/return undefined as unknown as T;/g' "$MONITORING_INDEX"

# Fix undefined union types in expressions
sed -i 's/config | undefined/config || undefined/g' "$MONITORING_INDEX"
sed -i 's/value | undefined/value || undefined/g' "$MONITORING_INDEX"

# But keep union types in type declarations
sed -i 's/(): T || undefined/(): T | undefined/g' "$MONITORING_INDEX"
sed -i 's/<T || undefined>/<T | undefined>/g' "$MONITORING_INDEX"
sed -i 's/: string || undefined/: string | undefined/g' "$MONITORING_INDEX"

echo "Fixed TypeScript issues in monitoring files."
