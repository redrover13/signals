#!/bin/bash

echo "Fixing TypeScript errors in the signals library and codebase..."

# Fix enhanced-index.ts
# Replace any with proper types for equals function
sed -i 's/equals?: (a: any, b: any) => boolean;/equals?: <T>(a: T, b: T) => boolean;/g' libs/utils/signals/enhanced-index.ts

# Fix empty destroy method
sed -i 's/destroy() {}/destroy(): void {}/g' libs/utils/signals/enhanced-index.ts

# Fix index.ts
# Remove unused signalIdCounter
sed -i 's/let signalIdCounter = 0;//g' libs/utils/signals/index.ts

# Fix no-explicit-any in index.ts
sed -i 's/Record<string, Signal<any>>/Record<string, Signal<unknown>>/g' libs/utils/signals/index.ts
sed -i 's/(newValue?: T | ((prev: T) => T)) => {/(newValue?: T | ((prev: T) => T)): T => {/g' libs/utils/signals/index.ts
sed -i 's/signalFunction.get = () => currentValue;/signalFunction.get = (): T => currentValue;/g' libs/utils/signals/index.ts
sed -i 's/signalFunction.set = (value: T | ((prev: T) => T)) => {/signalFunction.set = (value: T | ((prev: T) => T)): void => {/g' libs/utils/signals/index.ts

# Fix invalid @ symbol usage in property names, which causes TypeScript syntax errors
echo "Fixing @ symbol usage in property names across the codebase..."

# Replace @property syntax with property syntax
find libs -type f -name "*.ts" -exec sed -i 's/\([a-zA-Z0-9_]*\)\.@\([a-zA-Z0-9_]*\)/\1.\2/g' {} \;

# Replace @variable syntax with variable syntax at the beginning of expressions
find libs -type f -name "*.ts" -exec sed -i 's/@\([a-zA-Z0-9_]*\) && /\1 \&\& /g' {} \;

# Fix template literals with @ symbols
find libs -type f -name "*.ts" -exec sed -i 's/${@\([a-zA-Z0-9_]*\) &&/${\1 \&\&/g' {} \;
find libs -type f -name "*.ts" -exec sed -i 's/\${config\.@\([a-zA-Z0-9_]*\) &&/\${config\.\1 \&\&/g' {} \;

# Fix template string literals with backquotes
find libs -type f -name "*.ts" -exec sed -i 's/`\([^`]*\)${config\.@\([a-zA-Z0-9_]*\) &&\([^`]*\)`/`\1${config\.\2 \&\&\3`/g' {} \;

echo "Fixed @ symbol usage in property names."

# Now let's also fix some specific issues with template literals in mcp-client.service.ts 
echo "Fixing specific template literal issues in mcp-client.service.ts..."

# Check if the file exists before attempting to fix it
if [ -f "libs/utils/api-clients/src/lib/mcp-client.service.ts" ]; then
    # Fix template literals in mcp-client.service.ts
    sed -i 's/`Request sending not implemented for connection type: ${config.@connection && connection.type}`/`Request sending not implemented for connection type: ${connection?.type || "unknown"}`/g' libs/utils/api-clients/src/lib/mcp-client.service.ts
    sed -i 's/`HTTP error ${error.response.status}: ${error.message}`/`HTTP error ${error?.response?.status || 0}: ${error?.message || "Unknown error"}`/g' libs/utils/api-clients/src/lib/mcp-client.service.ts
    sed -i 's/`Request timed out after ${timeout}ms`/`Request timed out after ${timeout || 0}ms`/g' libs/utils/api-clients/src/lib/mcp-client.service.ts
    echo "Fixed template literals in mcp-client.service.ts"
else
    echo "mcp-client.service.ts not found, skipping specific fixes"
fi

# Also fix unterminated template literals in mcp-utils.ts
echo "Fixing specific template literal issues in mcp-utils.ts..."

if [ -f "libs/utils/monitoring/src/lib/mcp-utils.ts" ]; then
    # Fix health check endpoint format
    sed -i 's/`${config.endpoint}\/health`/`${config.endpoint || ""}/health`/g' libs/utils/monitoring/src/lib/mcp-utils.ts
    
    # Fix Time Window string formatting
    sed -i "s/Time Window: \${@metrics && metrics.@timeWindow && timeWindow.start || 'N\/A'} to \${@metrics && metrics.@timeWindow && timeWindow.end || 'N\/A'}/Time Window: \${metrics?.timeWindow?.start || 'N\/A'} to \${metrics?.timeWindow?.end || 'N\/A'}/g" libs/utils/monitoring/src/lib/mcp-utils.ts
    
    echo "Fixed template literals in mcp-utils.ts"
else
    echo "mcp-utils.ts not found, skipping specific fixes"
fi

# Fix nx-integration.ts
# Fix void unused parameter with explicit void operator
sed -i 's/void mapStateToSignals;/void mapStateToSignals;/g' libs/utils/signals/src/nx-integration.ts

# Fix any in nx-integration.ts
sed -i 's/Record<string, Signal<any>>/Record<string, Signal<unknown>>/g' libs/utils/signals/src/nx-integration.ts

# Fix enhanced-signals.spec.ts
# Remove unused variables that are only used as types
cat > /tmp/type-fix.patch << 'EOF'
diff --git a/libs/utils/signals/src/enhanced-signals.spec.ts b/libs/utils/signals/src/enhanced-signals.spec.ts
index oldcode..newcode 100644
--- a/libs/utils/signals/src/enhanced-signals.spec.ts
+++ b/libs/utils/signals/src/enhanced-signals.spec.ts
@@ -135,9 +135,9 @@ describe('Enhanced Signals Library', () => {
 
   describe('TypeScript Type Safety', () => {
     it('should correctly infer signal types', () => {
-      const numSignal = createSignal(42);
-      const strSignal = createSignal('hello');
-      const objSignal = createSignal({ foo: 'bar' });
+      type NumSignalType = ReturnType<typeof createSignal<number>>;
+      type StrSignalType = ReturnType<typeof createSignal<string>>;
+      type ObjSignalType = ReturnType<typeof createSignal<{foo: string}>>;
 
       type NumType = SignalValue<typeof numSignal>;
       type StrType = SignalValue<typeof strSignal>;
@@ -157,7 +157,7 @@ describe('Enhanced Signals Library', () => {
         name: string;
       }
 
-      const objSignal = createSignal<TestObject>({ id: 1, name: 'test' });
+      type ObjSignalType = ReturnType<typeof createSignal<TestObject>>;
 
       type UnwrappedType = UnwrapSignal<typeof objSignal>;
 
EOF
patch -p1 -d /home/g_nelson/signals-1 < /tmp/type-fix.patch || echo "Patch application failed, manual fix may be required"

# Fix angular-signal-adapter.ts empty arrow function
sed -i 's/() => {}/(): void => {}/g' libs/utils/signals/src/angular-signal-adapter.ts

echo "Completed fixes for TypeScript errors in the codebase."
echo "Run 'npx tsc --noEmit' to verify the fixes."
