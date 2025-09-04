#!/bin/bash

echo "Fixing remaining TypeScript errors with dot notation and bracket access..."

# Fix "value ? value. : null" syntax
find libs -type f -name "*.ts" -exec sed -i 's/\([a-zA-Z0-9_]*\) ? \1\. : null;/\1 ? \1 : null;/g' {} \;

# Fix "context && context.['property']" syntax
find libs -type f -name "*.ts" -exec sed -i "s/context && context.\['\\([a-zA-Z0-9_]*\\)'\]/context?.\1/g" {} \;
find libs -type f -name "*.ts" -exec sed -i "s/params && params.\['\\([a-zA-Z0-9_]*\\)'\]/params?.\1/g" {} \;
find libs -type f -name "*.ts" -exec sed -i "s/config && config.\['\\([a-zA-Z0-9_]*\\)'\]/config?.\1/g" {} \;

# Fix various specific files with dot notation issues
# Fix libs/adk/src/agents/root-agent.ts:90:27
sed -i 's/return Array ? Array. : null;from/return Array ? Array.from : null;/g' libs/adk/src/agents/root-agent.ts

# Fix libs/agents/gemini-orchestrator/src/lib/clients/bigquery.client.ts issues
sed -i 's/return value ? value. : null;map/return value ? value.map : null;/g' libs/agents/gemini-orchestrator/src/lib/clients/bigquery.client.ts
sed -i 's/return value ? value. : null;toISOString/return value ? value.toISOString : null;/g' libs/agents/gemini-orchestrator/src/lib/clients/bigquery.client.ts
sed -i 's/return JSON ? JSON. : null;stringify/return JSON ? JSON.stringify : null;/g' libs/agents/gemini-orchestrator/src/lib/clients/bigquery.client.ts

# Fix libs/agents/gemini-orchestrator/src/lib/clients/firebase.client.ts issues
sed -i 's/return db ? db. : null;collection/return db ? db.collection : null;/g' libs/agents/gemini-orchestrator/src/lib/clients/firebase.client.ts
sed -i 's/return docRef ? docRef. : null;id/return docRef ? docRef.id : null;/g' libs/agents/gemini-orchestrator/src/lib/clients/firebase.client.ts

# Fix libs/agents/gemini-orchestrator/src/lib/config/environment-config.ts issues
sed -i 's/return enabledServers ? enabledServers. : null;includes/return enabledServers ? enabledServers.includes : null;/g' libs/agents/gemini-orchestrator/src/lib/config/environment-config.ts

# Fix libs/agents/gemini-orchestrator/src/lib/mcp.service.ts issues
sed -i 's/return MCPService ? MCPService. : null;instance/return MCPService ? MCPService.instance : null;/g' libs/agents/gemini-orchestrator/src/lib/mcp.service.ts

# Fix libs/agents/gemini-orchestrator/src/lib/tools.ts issues
sed -i 's/return Object ? Object. : null;values/return Object ? Object.values : null;/g' libs/agents/gemini-orchestrator/src/lib/tools.ts

# Fix libs/agents/looker-agent/src/lib/looker-agent.ts issues
sed -i "s/data\.\[0\]\?\.\\['menu_items && menu_items.item_name'\\]/data\?.\[0\]?.menu_items?.item_name/g" libs/agents/looker-agent/src/lib/looker-agent.ts

# Fix libs/agents/reviews-agent/src/lib/reviews-agent.ts issues
sed -i 's/return insights ? insights. : null;length/return insights ? insights.length : null;/g' libs/agents/reviews-agent/src/lib/reviews-agent.ts

# Fix libs/env/src/env.spec.ts issues
sed -i 's/expect(() => new URL(config && config.NEXT_PUBLIC_API_BASE)).not && .not.toThrow();/expect(() => new URL(config?.NEXT_PUBLIC_API_BASE)).not.toThrow();/g' libs/env/src/env.spec.ts

# Fix libs/mcp/src/lib/config/environment-config.ts issues
sed -i 's/config && config.global.logLevel = /config.global.logLevel = /g' libs/mcp/src/lib/config/environment-config.ts
sed -i 's/config && config.global.enableMetrics = /config.global.enableMetrics = /g' libs/mcp/src/lib/config/environment-config.ts
sed -i 's/config && config.cache.ttl = /config.cache.ttl = /g' libs/mcp/src/lib/config/environment-config.ts
sed -i 's/config && config.global.timeout = /config.global.timeout = /g' libs/mcp/src/lib/config/environment-config.ts
sed -i 's/config && config.global.retryCount = /config.global.retryCount = /g' libs/mcp/src/lib/config/environment-config.ts
sed -i 's/config && config.global.maxConcurrentConnections = /config.global.maxConcurrentConnections = /g' libs/mcp/src/lib/config/environment-config.ts
sed -i 's/config && config.security.rateLimiting.maxRequests = /config.security.rateLimiting.maxRequests = /g' libs/mcp/src/lib/config/environment-config.ts

# Fix libs/utils/api-clients/src/lib/request-router.service.ts issues
sed -i 's/getCurrentConfig && getCurrentConfig.()/getCurrentConfig()/g' libs/utils/api-clients/src/lib/request-router.service.ts

# Fix libs/utils/signals/src/signals.spec.ts issues
sed -i 's/unsubscribe && unsubscribe.()/unsubscribe()/g' libs/utils/signals/src/signals.spec.ts

echo "Completed fixes for remaining TypeScript errors."
echo "Run 'npx tsc --noEmit' to verify the fixes."
