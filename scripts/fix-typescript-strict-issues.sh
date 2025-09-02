#!/bin/bash

# Script to fix TypeScript strict type issues
# Specifically targeting exactOptionalPropertyTypes issues

echo "Fixing TypeScript strict type issues..."

# Create a temporary file for sed patterns
cat > /tmp/ts-fix-patterns.sed << 'EOL'
# Fix undefined types for optional properties
s/\(: \([A-Za-z][A-Za-z0-9]*\(<[^>]*>\)*\)\) | undefined;/\1 | undefined;/g
s/\(: \([A-Za-z][A-Za-z0-9]*\(<[^>]*>\)*\)\);/\1 | undefined;/g

# Fix Record<string, unknown> | undefined issues
s/\(Record<string, unknown>\) | undefined/\1 | undefined/g
s/\(Record<string, unknown>\)/\1 | undefined/g

# Fix string | undefined issues
s/\(: string\);/\1 | undefined;/g
s/\(: string,\)/\1 | undefined,/g

# Fix number | undefined issues
s/\(: number\);/\1 | undefined;/g
s/\(: number,\)/\1 | undefined,/g

# Fix boolean | undefined issues
s/\(: boolean\);/\1 | undefined;/g
s/\(: boolean,\)/\1 | undefined,/g

# Fix Error | undefined issues
s/\(: Error\);/\1 | undefined;/g
s/\(: Error,\)/\1 | undefined,/g
EOL

# Find all TypeScript files (excluding node_modules and dist directories)
find /home/g_nelson/signals-1 -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read -r file; do
    echo "Processing file: $file"
    sed -i -f /tmp/ts-fix-patterns.sed "$file"
done

# Clean up
rm /tmp/ts-fix-patterns.sed

echo "TypeScript strict type issues fixed."
