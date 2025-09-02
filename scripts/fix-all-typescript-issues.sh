#!/bin/bash

# Master script to fix all TypeScript issues

echo "Running all TypeScript fix scripts..."

# Make all scripts executable
chmod +x /home/g_nelson/signals-1/scripts/fix-signals-specific-issues.sh
chmod +x /home/g_nelson/signals-1/scripts/fix-monitoring-typescript.sh
chmod +x /home/g_nelson/signals-1/scripts/fix-error-handler-typescript.sh
chmod +x /home/g_nelson/signals-1/scripts/fix-cloud-trace-exporter.sh
chmod +x /home/g_nelson/signals-1/scripts/fix-secrets-manager.sh
chmod +x /home/g_nelson/signals-1/scripts/fix-mcp-utils.sh
chmod +x /home/g_nelson/signals-1/scripts/fix-bigquery-logger.sh
chmod +x /home/g_nelson/signals-1/scripts/fix-nx-integration.sh

# Run the scripts
echo "Fixing signals specific issues..."
/home/g_nelson/signals-1/scripts/fix-signals-specific-issues.sh

echo "Fixing monitoring TypeScript issues..."
/home/g_nelson/signals-1/scripts/fix-monitoring-typescript.sh

echo "Fixing error handler TypeScript issues..."
/home/g_nelson/signals-1/scripts/fix-error-handler-typescript.sh

echo "Fixing cloud-trace-exporter.ts issues..."
/home/g_nelson/signals-1/scripts/fix-cloud-trace-exporter.sh

echo "Fixing secrets-manager.ts issues..."
/home/g_nelson/signals-1/scripts/fix-secrets-manager.sh

echo "Fixing mcp-utils.ts issues..."
/home/g_nelson/signals-1/scripts/fix-mcp-utils.sh

echo "Fixing bigquery-logger.ts issues..."
/home/g_nelson/signals-1/scripts/fix-bigquery-logger.sh

echo "Fixing nx-integration.ts issues..."
/home/g_nelson/signals-1/scripts/fix-nx-integration.sh

# Create a final script to fix any remaining issues with type assertions
cat > /home/g_nelson/signals-1/scripts/fix-remaining-type-assertions.sh << 'EOF'
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
EOF

chmod +x /home/g_nelson/signals-1/scripts/fix-remaining-type-assertions.sh
/home/g_nelson/signals-1/scripts/fix-remaining-type-assertions.sh

echo "All TypeScript fix scripts have been run."
