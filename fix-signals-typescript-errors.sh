#!/bin/bash

echo "Fixing TypeScript errors in the signals library..."

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

# Run linting to check for remaining issues
echo "Running linting to check for remaining issues..."
nx run signals:lint

echo "Done fixing TypeScript errors in the signals library. Please check the remaining warnings."
