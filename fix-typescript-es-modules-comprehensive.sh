#!/bin/bash

# Main script to fix all TypeScript errors after migrating to ES modules with lodash-es (comprehensive)

echo "Starting comprehensive fix for TypeScript errors..."

# Make all fix scripts executable
chmod +x /home/g_nelson/signals-1/fix-performance-metrics-comprehensive.sh
chmod +x /home/g_nelson/signals-1/fix-signals-comprehensive.sh
chmod +x /home/g_nelson/signals-1/fix-common-typescript-errors.sh

# Run all fix scripts
/home/g_nelson/signals-1/fix-performance-metrics-comprehensive.sh
/home/g_nelson/signals-1/fix-signals-comprehensive.sh
/home/g_nelson/signals-1/fix-common-typescript-errors.sh

echo "All TypeScript fixes applied. Running TypeScript check..."

# Run TypeScript check to verify fixes
cd /home/g_nelson/signals-1 && pnpm ts:check

echo "Fix script complete."
