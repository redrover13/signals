#!/bin/bash

# Script to fix specific TypeScript syntax errors in the codebase
echo "🔧 Fixing specific TypeScript syntax errors..."

# Fix vertex.ts
echo "Fixing libs/adk/src/services/vertex.ts..."
VERTEX_TS="/home/g_nelson/signals-1/libs/adk/src/services/vertex.ts"
cp "$VERTEX_TS" "${VERTEX_TS}.bak"
sed -i '257s/chunk && chunk.embedding = embeddingResponse && embeddingResponse.embeddings\[index\];/if (chunk && embeddingResponse) { chunk.embedding = embeddingResponse.embeddings[index]; }/g' "$VERTEX_TS"

# Fix gcp-tools.ts
echo "Fixing libs/adk/src/tools/gcp-tools.ts..."
GCP_TOOLS_TS="/home/g_nelson/signals-1/libs/adk/src/tools/gcp-tools.ts"
cp "$GCP_TOOLS_TS" "${GCP_TOOLS_TS}.bak"
sed -i '99s/fetchOptions && fetchOptions.body = body as string;/if (fetchOptions) { fetchOptions.body = body as string; }/g' "$GCP_TOOLS_TS"

# Fix error-handling.ts
echo "Fixing libs/adk/src/utilities/error-handling.ts..."
ERROR_HANDLING_TS="/home/g_nelson/signals-1/libs/adk/src/utilities/error-handling.ts"
cp "$ERROR_HANDLING_TS" "${ERROR_HANDLING_TS}.bak"
sed -i '207s/ADKErrorHandler && ADKErrorHandler.handler = handler;/if (ADKErrorHandler) { ADKErrorHandler.handler = handler; }/g' "$ERROR_HANDLING_TS"
sed -i '214s/ADKErrorHandler && ADKErrorHandler.handler = ADKErrorHandler && ADKErrorHandler.defaultHandler;/if (ADKErrorHandler) { ADKErrorHandler.handler = ADKErrorHandler.defaultHandler; }/g' "$ERROR_HANDLING_TS"

# Fix performance.ts
echo "Fixing libs/adk/src/utilities/performance.ts..."
PERFORMANCE_TS="/home/g_nelson/signals-1/libs/adk/src/utilities/performance.ts"
cp "$PERFORMANCE_TS" "${PERFORMANCE_TS}.bak"
sed -i '104s/metric && metric.value += value;/if (metric) { metric.value += value; }/g' "$PERFORMANCE_TS"
sed -i '145s/metric && metric.value = value;/if (metric) { metric.value = value; }/g' "$PERFORMANCE_TS"
sed -i '263s/span && span.attributes = {/if (span) { span.attributes = {/g' "$PERFORMANCE_TS"
sed -i '264s/...span && ...span.attributes,/...(span.attributes || {}),/g' "$PERFORMANCE_TS"
sed -i '265s/...attributes,/...attributes/g' "$PERFORMANCE_TS"
sed -i '266s/};/}; }/g' "$PERFORMANCE_TS"
sed -i '284s/span && span.endTime = Date.now();/if (span) { span.endTime = Date.now(); }/g' "$PERFORMANCE_TS"
sed -i '285s/span && span.duration = span && span.endTime - span && span.startTime;/if (span) { span.duration = span.endTime - span.startTime; }/g' "$PERFORMANCE_TS"
sed -i '286s/span && span.status = status;/if (span) { span.status = status; }/g' "$PERFORMANCE_TS"

# Fix bigquery.client.ts
echo "Fixing libs/agents/gemini-orchestrator/src/lib/clients/bigquery.client.ts..."
BIGQUERY_CLIENT_TS="/home/g_nelson/signals-1/libs/agents/gemini-orchestrator/src/lib/clients/bigquery.client.ts"
cp "$BIGQUERY_CLIENT_TS" "${BIGQUERY_CLIENT_TS}.bak"
sed -i '70s/options && (options.params =) queryParams;/if (options) { options.params = queryParams; }/g' "$BIGQUERY_CLIENT_TS"

# Fix firebase.client.ts
echo "Fixing libs/agents/gemini-orchestrator/src/lib/clients/firebase.client.ts..."
FIREBASE_CLIENT_TS="/home/g_nelson/signals-1/libs/agents/gemini-orchestrator/src/lib/clients/firebase.client.ts"
cp "$FIREBASE_CLIENT_TS" "${FIREBASE_CLIENT_TS}.bak"
sed -i '248s/...Object && ...Object.entries(data).reduce((acc, \[key, value\]) => {/...Object.entries(data).reduce((acc, [key, value]) => {/g' "$FIREBASE_CLIENT_TS"

# Fix mcp.service.ts
echo "Fixing libs/agents/gemini-orchestrator/src/lib/mcp.service.ts..."
MCP_SERVICE_TS="/home/g_nelson/signals-1/libs/agents/gemini-orchestrator/src/lib/mcp.service.ts"
cp "$MCP_SERVICE_TS" "${MCP_SERVICE_TS}.bak"
sed -i '425s/.servers && .servers.filter((server) => server.enabled)/.servers.filter((server) => server.enabled)/g' "$MCP_SERVICE_TS"

# Fix mcp-client.service.ts
echo "Fixing libs/mcp/src/lib/clients/mcp-client.service.ts..."
MCP_CLIENT_SERVICE_TS="/home/g_nelson/signals-1/libs/mcp/src/lib/clients/mcp-client.service.ts"
cp "$MCP_CLIENT_SERVICE_TS" "${MCP_CLIENT_SERVICE_TS}.bak"
sed -i '108s/if (this.config?.global.healthMonitoring && .global.healthMonitoring.enabled) {/if (this.config?.global.healthMonitoring && this.config?.global.healthMonitoring.enabled) {/g' "$MCP_CLIENT_SERVICE_TS"

# Fix signals/index.ts
echo "Fixing libs/utils/signals/index.ts..."
SIGNALS_INDEX_TS="/home/g_nelson/signals-1/libs/utils/signals/index.ts"
cp "$SIGNALS_INDEX_TS" "${SIGNALS_INDEX_TS}.bak"
sed -i '93s/return derivedValue/return derivedValue;/g' "$SIGNALS_INDEX_TS"

# Fix nx-integration.ts
echo "Fixing libs/utils/signals/src/nx-integration.ts..."
NX_INTEGRATION_TS="/home/g_nelson/signals-1/libs/utils/signals/src/nx-integration.ts"
cp "$NX_INTEGRATION_TS" "${NX_INTEGRATION_TS}.bak"
sed -i '26s/}) as T);/});/g' "$NX_INTEGRATION_TS"
sed -i '50s/}) as T);/});/g' "$NX_INTEGRATION_TS"

echo "✅ All specific TypeScript syntax errors fixed!"
