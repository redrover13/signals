#!/bin/bash

# Final comprehensive fix script for all TypeScript issues

echo "Running final comprehensive fixes for TypeScript ES modules migration..."

# Make scripts executable
chmod +x /home/g_nelson/signals-1/fix-connection-pool-comprehensive.sh
chmod +x /home/g_nelson/signals-1/fix-cache-service-comprehensive.sh
chmod +x /home/g_nelson/signals-1/fix-logging-comprehensive.sh

# Run all the comprehensive fixes
/home/g_nelson/signals-1/fix-connection-pool-comprehensive.sh
/home/g_nelson/signals-1/fix-cache-service-comprehensive.sh
/home/g_nelson/signals-1/fix-logging-comprehensive.sh

# Run the previous fixes for the remaining files
if [ -f "/home/g_nelson/signals-1/fix-typescript-es-modules-comprehensive.sh" ]; then
  echo "Running previous fixes for remaining files..."
  /home/g_nelson/signals-1/fix-typescript-es-modules-comprehensive.sh
fi

echo "All fixes have been applied. Running TypeScript check..."
cd /home/g_nelson/signals-1 && pnpm ts:check

echo "Fix script completed."
