#!/bin/bash

# Final comprehensive fix script for all TypeScript issues

echo "Running final ES module migration fixes for TypeScript..."

# Make scripts executable
chmod +x /home/g_nelson/signals-1/fix-signals-index-final.sh
chmod +x /home/g_nelson/signals-1/fix-adk-logging-final.sh
chmod +x /home/g_nelson/signals-1/fix-connection-pool-comprehensive.sh
chmod +x /home/g_nelson/signals-1/fix-cache-service-comprehensive.sh
chmod +x /home/g_nelson/signals-1/fix-logging-comprehensive.sh

# Run the final fixes
/home/g_nelson/signals-1/fix-signals-index-final.sh
/home/g_nelson/signals-1/fix-adk-logging-final.sh
/home/g_nelson/signals-1/fix-connection-pool-comprehensive.sh
/home/g_nelson/signals-1/fix-cache-service-comprehensive.sh
/home/g_nelson/signals-1/fix-logging-comprehensive.sh

# Create a comprehensive fix for the environment-config.ts file that has many errors
echo "Fixing environment-config.ts issues..."

# Fix spread syntax issues in environment-config.ts files
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/\.\.\.\(server\) && \.\.\.\1/\.\.\.\1/g' {} \;
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/\.\.\.\(this\) && \.\.\.\1/\.\.\.\1/g' {} \;
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/\.\.\.\(process\) && \.\.\.\1/\.\.\.\1/g' {} \;
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/\.\.\.\(query\) && \.\.\.\1/\.\.\.\1/g' {} \;
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/\.\.\.\(baseServers\) && \.\.\.\1/\.\.\.\1/g' {} \;

# Fix property access issues
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/config?\.servers && \.servers/config?.servers/g' {} \;
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/config?\.global && \.global/config?.global/g' {} \;
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/config?\.cache && \.cache/config?.cache/g' {} \;
find /home/g_nelson/signals-1/libs -name "environment-config.ts" -type f -exec sed -i 's/config?\.security\.rateLimiting && \.security\.rateLimiting/config?.security.rateLimiting/g' {} \;

# Fix similar issues in other files
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/\.\.\.\(server\) && \.\.\.\1/\.\.\.\1/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/\.\.\.\(this\) && \.\.\.\1/\.\.\.\1/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/\.\.\.\(process\) && \.\.\.\1/\.\.\.\1/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/\.\.\.\(query\) && \.\.\.\1/\.\.\.\1/g' {} \;

# Fix property access issues in all TypeScript files
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/config?\.servers && \.servers/config?.servers/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/config?\.global && \.global/config?.global/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/config?\.cache && \.cache/config?.cache/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/config?\.auth\.credentials && \.auth\.credentials/config?.auth.credentials/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/config?\.auth && \.auth/config?.auth/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/config?\.connection && \.connection/config?.connection/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/result?\.name && \.name/result?.name/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/result?\.duration && \.duration/result?.duration/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/result?\.opsPerSecond && \.opsPerSecond/result?.opsPerSecond/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/result?\.error && \.error/result?.error/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/result?\.response && \.response/result?.response/g' {} \;

# Fix logical AND being used for property assignment
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/\(target\) && \1\._instance = /\1._instance = /g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/\(connection\) && \1\.\(status\|lastConnected\|lastError\|process\|client\) = /\1.\2 = /g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/\(config\) && (\1\.connection =)/\1.connection =/g' {} \;
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/MCPService && MCPService\.instance = /MCPService.instance = /g' {} \;

# Fix parentheses in condition expressions
find /home/g_nelson/signals-1/libs -name "*.ts" -type f -exec sed -i 's/config?\.auth && (auth\.type =)== /config?.auth \&\& auth.type === /g' {} \;

echo "Running TypeScript check..."
cd /home/g_nelson/signals-1 && pnpm ts:check

echo "ES module migration fix script completed."
