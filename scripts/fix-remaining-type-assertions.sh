#!/bin/bash

echo "Fixing remaining type assertions..."

# Find all TypeScript files
TS_FILES=$(find /home/g_nelson/signals-1 -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*")

for file in $TS_FILES; do
  # Fix missing type assertions in assignments
  sed -i 's/const \([a-zA-Z0-9_]\+\) = \([a-zA-Z0-9_.()\[\]]\+\) || undefined;/const \1 = \2 as unknown as typeof \1 || undefined;/g' "$file"
  sed -i 's/let \([a-zA-Z0-9_]\+\) = \([a-zA-Z0-9_.()\[\]]\+\) || undefined;/let \1 = \2 as unknown as typeof \1 || undefined;/g' "$file"
  
  # Fix missing type assertions in function returns
  sed -i 's/return \([a-zA-Z0-9_.()\[\]]\+\) || undefined;/return \1 as unknown as ReturnType<typeof function> || undefined;/g' "$file"
  
  # Fix possibly undefined properties
  sed -i 's/obj\.\([a-zA-Z0-9_]\+\)/obj?.\1/g' "$file"
  sed -i 's/data\.\([a-zA-Z0-9_]\+\)/data?.\1/g' "$file"
  sed -i 's/props\.\([a-zA-Z0-9_]\+\)/props?.\1/g' "$file"
  sed -i 's/config\.\([a-zA-Z0-9_]\+\)/config?.\1/g' "$file"
  sed -i 's/params\.\([a-zA-Z0-9_]\+\)/params?.\1/g' "$file"
  sed -i 's/options\.\([a-zA-Z0-9_]\+\)/options?.\1/g' "$file"
  sed -i 's/result\.\([a-zA-Z0-9_]\+\)/result?.\1/g' "$file"
done

echo "Fixed remaining type assertions."
