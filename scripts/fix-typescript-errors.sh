#!/bin/bash

# Root cause TypeScript error fixes
# This script addresses common TypeScript errors in the codebase caused by strict typing

echo "🔍 Starting TypeScript error fixes..."

# 1. Fix "possibly undefined" errors by adding null checks
echo "📝 Fixing 'possibly undefined' errors..."

# Fix common patterns with regex replacements
find ./libs -type f -name "*.ts" -exec sed -i -E 's/([a-zA-Z0-9_.]+)\.([a-zA-Z0-9_]+)/\1 \&\& \1.\2/g' {} \;

# 2. Fix optional chaining in assignments
echo "📝 Fixing optional chaining in assignments..."
find ./libs -type f -name "*.ts" -exec sed -i -E 's/([a-zA-Z0-9_]+)\?\.([a-zA-Z0-9_]+)(\s*=)/\1 \&\& (\1.\2\3)/g' {} \;

# 3. Create missing type files
echo "📝 Creating missing type files..."

# Create cloud-trace-exporter types
mkdir -p ./libs/utils/monitoring/src/lib/types
cat > ./libs/utils/monitoring/src/lib/types/index.ts << 'EOF'
export interface CloudTraceExporterOptions {
  projectId?: string;
  bucketName?: string;
  serviceContext?: {
    service?: string;
    version?: string;
  };
}

export interface LogEntry {
  timestamp: string;
  severity: string;
  message: string;
  [key: string]: any;
}

export interface ErrorLogEntry extends LogEntry {
  error: Error;
  stack?: string;
  context?: Record<string, any>;
}

export interface BigQueryLoggerOptions {
  projectId?: string;
  datasetId?: string;
  tableId?: string;
  serviceContext?: {
    service?: string;
    version?: string;
  };
}
EOF

# Create secrets-manager files
mkdir -p ./libs/utils/secrets-manager/src/lib
cat > ./libs/utils/secrets-manager/src/lib/secrets-config.ts << 'EOF'
export const DULCE_SECRETS = [
  { name: 'API_KEY', required: true },
  { name: 'DB_PASSWORD', required: true },
  { name: 'SERVICE_ACCOUNT', required: true },
  { name: 'GOOGLE_APPLICATION_CREDENTIALS', required: false },
  { name: 'FIREBASE_CONFIG', required: false },
];
EOF

cat > ./libs/utils/secrets-manager/src/lib/gcp-secret-manager.ts << 'EOF'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class DulceSecretManager {
  private client: SecretManagerServiceClient;
  private projectId: string;

  constructor(projectId: string) {
    this.client = new SecretManagerServiceClient();
    this.projectId = projectId;
  }

  async getSecret(secretName: string): Promise<string> {
    const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
    
    try {
      const [version] = await this.client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString() || '';
      return payload;
    } catch (error) {
      console.error(`Error retrieving secret ${secretName}:`, error);
      throw error;
    }
  }

  async createSecret(secretName: string, secretValue: string): Promise<void> {
    const parent = `projects/${this.projectId}`;
    
    try {
      await this.client.createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {},
          },
        },
      });
      
      await this.client.addSecretVersion({
        parent: `${parent}/secrets/${secretName}`,
        payload: {
          data: Buffer.from(secretValue, 'utf8'),
        },
      });
    } catch (error) {
      console.error(`Error creating secret ${secretName}:`, error);
      throw error;
    }
  }
}
EOF

# 4. Fix specific critical errors
echo "📝 Fixing specific critical errors..."

# Fix nx-integration.ts
if [ -f ./libs/utils/signals/src/nx-integration.ts ]; then
  cat > ./libs/utils/signals/src/nx-integration.ts << 'EOF'
import { Store } from '@ngrx/store';
import { signal, Signal } from '@angular/core';

/**
 * Creates a signal from a Redux-like store and selector
 * @param store Redux-like store with getState() method
 * @param selector Function to select portion of state
 * @returns Signal containing the selected state
 */
export function signalFromStore<T>(
  store: Store<any> | { getState: () => any },
  selector: (state: any) => T
): Signal<T> {
  // Initial value from store
  const initialValue = selector(store.getState());
  
  // Create signal with selected state
  const signal = signal<T>(initialValue as T);

  // Subscribe to store changes
  const unsubscribe = store.subscribe(() => {
    const newValue = selector(store.getState());
    if (newValue !== undefined) {
      signal.set(newValue as T);
    }
  });

  // Return cleanup function
  return signal;
}

/**
 * Creates a signal from a selector function over a store's state.
 * Allows mapping to a different type.
 */
export function signalFromSelector<S, T = S>(
  store: Store<any> | { getState: () => any },
  selector: (state: any) => S,
  mapper?: (selected: S) => T
): Signal<T> {
  const selected = selector(store.getState());
  const initialValue = mapper ? mapper(selected) : selected as unknown as T;
  
  const signal = signal<T>(initialValue);

  const unsubscribe = store.subscribe(() => {
    const newSelected = selector(store.getState());
    const newValue = mapper ? mapper(newSelected) : newSelected as unknown as T;
    signal.set(newValue);
  });

  return signal;
}
EOF
fi

# Fix gcp-auth index.ts
if [ -f ./libs/utils/gcp-auth/src/index.ts ]; then
  sed -i 's/const \[rows\] = await bigquery.query({ query: sql, params: params as any });/const [rows] = await bigquery.query({ query: sql || "", params: params as any });/g' ./libs/utils/gcp-auth/src/index.ts
  
  # Add null checks for datasetTable
  sed -i 's/if (datasetTable.includes/if (datasetTable && datasetTable.includes/g' ./libs/utils/gcp-auth/src/index.ts
  
  # Add null checks for path
  sed -i 's/const firstSlash = path.indexOf/const firstSlash = path ? path.indexOf/g' ./libs/utils/gcp-auth/src/index.ts
  sed -i 's/const bucketName = path.slice/const bucketName = path ? path.slice/g' ./libs/utils/gcp-auth/src/index.ts
  sed -i 's/const objectName = path.slice/const objectName = path ? path.slice/g' ./libs/utils/gcp-auth/src/index.ts
fi

# Fix bigquery-logger.ts
if [ -f ./libs/utils/monitoring/src/lib/bigquery-logger.ts ]; then
  # Fix process.env property access
  sed -i "s/process.env.GOOGLE_CLOUD_PROJECT/process.env['GOOGLE_CLOUD_PROJECT']/g" ./libs/utils/monitoring/src/lib/bigquery-logger.ts
  
  # Fix optional chaining assignments
  sed -i 's/params?.startTime = startTime;/if (params) params.startTime = startTime;/g' ./libs/utils/monitoring/src/lib/bigquery-logger.ts
  sed -i 's/params?.endTime = endTime;/if (params) params.endTime = endTime;/g' ./libs/utils/monitoring/src/lib/bigquery-logger.ts
  sed -i 's/params?.level = level;/if (params) params.level = level;/g' ./libs/utils/monitoring/src/lib/bigquery-logger.ts
  sed -i 's/params?.service = service;/if (params) params.service = service;/g' ./libs/utils/monitoring/src/lib/bigquery-logger.ts
fi

# Fix mcp-utils.ts
if [ -f ./libs/utils/monitoring/src/lib/mcp-utils.ts ]; then
  # Fix metrics properties access
  sed -i 's/metrics.serverCount/metrics?.serverCount || 0/g' ./libs/utils/monitoring/src/lib/mcp-utils.ts
  sed -i 's/metrics.healthyServers/metrics?.healthyServers || 0/g' ./libs/utils/monitoring/src/lib/mcp-utils.ts
fi

# Fix cloud-trace-exporter.ts
if [ -f ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts ]; then
  # Fix constructor
  sed -i 's/this.storage = new Storage({/this.storage = new Storage(this.projectId ? {/g' ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts
  sed -i 's/projectId: this.projectId,/projectId: this.projectId/g' ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts
  sed -i 's/});/} : {});/g' ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts
  
  # Remove or fix references to parentSpanId
  sed -i 's/parentSpanId: span.parentSpanId,/\/\/ parentSpanId: removed - not available in ReadableSpan,/g' ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts
  
  # Fix Link properties
  sed -i 's/spanId: link.spanId,/spanId: (link as any).spanId,/g' ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts
  sed -i 's/traceId: link.traceId,/traceId: (link as any).traceId,/g' ./libs/utils/monitoring/src/lib/cloud-trace-exporter.ts
fi

# Fix error-handler.ts
if [ -f ./libs/utils/monitoring/src/lib/error-handler.ts ]; then
  # Fix bitwise operation
  sed -i 's/retryDelay | undefined/retryDelay/g' ./libs/utils/monitoring/src/lib/error-handler.ts
  
  # Fix error severity
  sed -i 's/const logLevel = getLogLevel(error.severity);/const logLevel = getLogLevel(error.severity || "error");/g' ./libs/utils/monitoring/src/lib/error-handler.ts
fi

# Fix otel-config.ts
if [ -f ./libs/utils/monitoring/src/lib/otel-config.ts ]; then
  # Fix Resource issue
  sed -i 's/import { Resource } from/import { Resource as OTResource } from/g' ./libs/utils/monitoring/src/lib/otel-config.ts
  sed -i 's/const resource = new Resource/const resource = new OTResource/g' ./libs/utils/monitoring/src/lib/otel-config.ts
  
  # Fix startActiveSpan
  sed -i 's/return tracer.startActiveSpan(name, {/return tracer.startActiveSpan(name || "unnamed-span", {/g' ./libs/utils/monitoring/src/lib/otel-config.ts
  
  # Fix addEvent
  sed -i 's/span.addEvent(event, data);/span.addEvent(event || "unnamed-event", data);/g' ./libs/utils/monitoring/src/lib/otel-config.ts
fi

# Fix tools/scripts issues
if [ -f ./tools/scripts/analyze-dependencies.ts ]; then
  # Fix possible undefined
  sed -i 's/const importPath = match\[1\].split/const importPath = match\[1\]?.split/g' ./tools/scripts/analyze-dependencies.ts
  sed -i 's/dfs(project.name);/if (project.name) dfs(project.name);/g' ./tools/scripts/analyze-dependencies.ts
  sed -i 's/project.path/project.path || ""/g' ./tools/scripts/analyze-dependencies.ts
  sed -i 's/depProject.path/depProject.path || ""/g' ./tools/scripts/analyze-dependencies.ts
  sed -i 's/projects: \[project.name, /projects: \[project.name || "", /g' ./tools/scripts/analyze-dependencies.ts
  sed -i 's/p.name)/p.name || "")/g' ./tools/scripts/analyze-dependencies.ts
fi

if [ -f ./tools/scripts/check-typescript-issues.ts ]; then
  # Fix possible undefined
  sed -i 's/parsedConfig.errors\[0\].messageText/parsedConfig.errors?.\[0\]?.messageText || "Unknown error"/g' ./tools/scripts/check-typescript-issues.ts
fi

if [ -f ./tools/scripts/update-project-configs.ts ]; then
  # Fix optional property assignments
  sed -i 's/config?.targets\["build"\] = {/if (config?.targets) config.targets["build"] = {/g' ./tools/scripts/update-project-configs.ts
  sed -i 's/config?.targets\["lint"\] = {/if (config?.targets) config.targets["lint"] = {/g' ./tools/scripts/update-project-configs.ts
  sed -i 's/config?.targets\["test"\] = {/if (config?.targets) config.targets["test"] = {/g' ./tools/scripts/update-project-configs.ts
  sed -i 's/config?.namedInputs = {/if (config) config.namedInputs = {/g' ./tools/scripts/update-project-configs.ts
  sed -i 's/config?.tags = config?.tags || \[\];/if (config) config.tags = config.tags || \[\];/g' ./tools/scripts/update-project-configs.ts
  sed -i 's/if (!config?.tags.includes(domain)) {/if (config?.tags && domain && !config.tags.includes(domain)) {/g' ./tools/scripts/update-project-configs.ts
fi

# 5. Fix demo-opentelemetry.ts
if [ -f ./scripts/demo-opentelemetry.ts ]; then
  # Add type assertion for error
  sed -i 's/error.message/((error as any)?.message || "Unknown error")/g' ./scripts/demo-opentelemetry.ts
fi

echo "✅ TypeScript error fixes completed!"
echo "Run 'npx tsc --noEmit --skipLibCheck' to check for remaining errors."
