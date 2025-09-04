#!/bin/bash

# Script to fix syntax errors in multiple files
set -e

echo "===== Fixing API docs workflow file ====="
# Fix duplicate publish_dir in api-docs.yml
sed -i '/          github_token: \${{ secrets.GITHUB_TOKEN }}/,/          publish_dir: \.\/docs\/api/ {
  /publish_dir: \.\/docs\/api/d
}' .github/workflows/api-docs.yml

echo "===== Fixing enhanced CICD workflow file ====="
# Fix indentation in enhanced-cicd.yml - fixing the major indentation issue
sed -i 's/^    name: Build and Test/  build-and-test:\n    name: Build and Test/' .github/workflows/enhanced-cicd.yml

echo "===== Fixing monitoring workflow file ====="
# Fix monitoring.yml syntax
if grep -q "^file" .github/workflows/monitoring.yml; then
  sed -i '1s/^file/name: Infrastructure Monitoring \& Alerting/' .github/workflows/monitoring.yml
fi

echo "===== Fixing typescript validation workflow file ====="
# Fix duplicate runs-on in typescript-validation.yml
sed -i '/    runs-on: ubuntu-latest/,/    timeout-minutes: 5/ {
  /runs-on: ubuntu-latest/d
}' .github/workflows/typescript-validation.yml

echo "===== Fixing ADK test files ====="
# Fix syntax in base-agent.spec.ts
sed -i 's/await expect(mockAgent && mockAgent.invoke({ task: '\''test'\'' })).rejects && .rejects.toThrow/await expect(mockAgent && mockAgent.invoke({ task: '\''test'\'' })).rejects.toThrow/' libs/adk/src/agents/base-agent.spec.ts

# Fix syntax in vertex.spec.ts
sed -i 's/const firstChunkEnd = chunks\[0\].content && .content.split/const firstChunkEnd = chunks[0].content.split/' libs/adk/src/services/vertex.spec.ts
sed -i 's/const secondChunkStart = chunks\[1\].content && .content.split/const secondChunkStart = chunks[1].content.split/' libs/adk/src/services/vertex.spec.ts

echo "===== Fixing security test files ====="
# Fix syntax in security.test.ts
sed -i 's/expect(() => secretManager && secretManager.clearCache()).not && .not.toThrow()/expect(() => secretManager && secretManager.clearCache()).not.toThrow()/' libs/security/src/security.test.ts

echo "===== Fixing monitoring test files ====="
# Fix syntax in monitoring.spec.ts
sed -i "s/).rejects && .rejects.toThrow/).rejects.toThrow/" libs/utils/monitoring/src/lib/monitoring.spec.ts

echo "===== Fixing TypeScript diagnostic scripts ====="
# Fix lodash import replacement in fix-module-not-found.js
sed -i "s/replace: 'from 'lodash-es''/replace: \"from 'lodash-es'\"/" typescript-diagnostics/scripts/fixes/fix-module-not-found.js

# Fix quotes in fix-name-not-found.js
sed -i "s/'React': 'import React from 'react';',/'React': \"import React from 'react';\",/" typescript-diagnostics/scripts/fixes/fix-name-not-found.js
sed -i "s/'useState': 'import { useState } from 'react';',/'useState': \"import { useState } from 'react';\",/" typescript-diagnostics/scripts/fixes/fix-name-not-found.js
sed -i "s/'useEffect': 'import { useEffect } from 'react';',/'useEffect': \"import { useEffect } from 'react';\",/" typescript-diagnostics/scripts/fixes/fix-name-not-found.js
sed -i "s/'useMemo': 'import { useMemo } from 'react';',/'useMemo': \"import { useMemo } from 'react';\",/" typescript-diagnostics/scripts/fixes/fix-name-not-found.js

echo "===== Fixing MCP JSON files ====="
# Fix .kilocode/mcp.json
echo '{"mcpServers":{}}' > .kilocode/mcp.json

# Fix project-list.json
if grep -q "NX   Failed to process project graph" project-list.json; then
  echo '[]' > project-list.json
fi

# Fix temp.json
if grep -q "Unexpected token" temp.json; then
  echo '{}' > temp.json
fi

echo "===== All syntax errors fixed ====="
