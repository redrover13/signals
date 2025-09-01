#!/bin/bash

# Master script to fix all TypeScript issues

echo "Running all TypeScript fix scripts..."

# Run individual fix scripts
echo "Running fix-nx-integration.sh"
/home/g_nelson/signals-1/scripts/fix-nx-integration.sh

echo "Running fix-server-health.sh"
/home/g_nelson/signals-1/scripts/fix-server-health.sh

echo "Running fix-mcp-server-health.sh"
/home/g_nelson/signals-1/scripts/fix-mcp-server-health.sh

echo "Running fix-mcp-client.sh"
/home/g_nelson/signals-1/scripts/fix-mcp-client.sh

echo "Running fix-common-types-gcp-auth.sh"
/home/g_nelson/signals-1/scripts/fix-common-types-gcp-auth.sh

echo "Running fix-request-router.sh"
/home/g_nelson/signals-1/scripts/fix-request-router.sh

echo "Running fix-mcp-utils.sh"
/home/g_nelson/signals-1/scripts/fix-mcp-utils.sh

echo "All TypeScript fix scripts completed."

# Run TypeScript to check for remaining errors
echo "Running TypeScript compiler to check for remaining errors..."
cd /home/g_nelson/signals-1 && npx tsc --noEmit
