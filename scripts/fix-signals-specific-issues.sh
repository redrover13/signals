#!/bin/bash

# Fix the specific signals file issues

echo "Fixing specific issues in signals files..."

SIGNALS_INDEX="/home/g_nelson/signals-1/libs/utils/signals/src/index.ts"
cp "$SIGNALS_INDEX" "${SIGNALS_INDEX}.bak"

# Replace specific code pattern
sed -i 's/storedValue = item ? JSON.parse(item) : initialValue | undefined;/storedValue = item ? JSON.parse(item) : initialValue || undefined;/g' "$SIGNALS_INDEX"

# Fix type assertion
sed -i 's/return \[value, signal.set\];/return [value as T, signal.set];/g' "$SIGNALS_INDEX"

# Fix localStorage.getItem
sed -i 's/window.localStorage.getItem(key)/window.localStorage.getItem(key || "")/g' "$SIGNALS_INDEX"

# Fix localStorage.setItem
sed -i 's/window.localStorage.setItem(key, JSON.stringify(newValue));/window.localStorage.setItem(key || "", JSON.stringify(newValue));/g' "$SIGNALS_INDEX"

# Do the same for the other signals file
SIGNALS_INDEX2="/home/g_nelson/signals-1/libs/utils/signals/index.ts"
cp "$SIGNALS_INDEX2" "${SIGNALS_INDEX2}.bak"

sed -i 's/storedValue = item ? JSON.parse(item) : initialValue | undefined;/storedValue = item ? JSON.parse(item) : initialValue || undefined;/g' "$SIGNALS_INDEX2"
sed -i 's/return \[value, signal.set\];/return [value as T, signal.set];/g' "$SIGNALS_INDEX2"
sed -i 's/window.localStorage.getItem(key)/window.localStorage.getItem(key || "")/g' "$SIGNALS_INDEX2"
sed -i 's/window.localStorage.setItem(key, JSON.stringify(newValue));/window.localStorage.setItem(key || "", JSON.stringify(newValue));/g' "$SIGNALS_INDEX2"

# Fix nx-integration.ts
NX_INT="/home/g_nelson/signals-1/libs/utils/signals/src/nx-integration.ts"
cp "$NX_INT" "${NX_INT}.bak"

# Fix T | undefined not assignable to T issues
sed -i 's/const signal = createSignal<S>(selector(store.getState()));/const signal = createSignal<S>(selector(store.getState()) as S);/g' "$NX_INT"
sed -i 's/signal.set(selector(store.getState()));/signal.set(selector(store.getState()) as S);/g' "$NX_INT"
sed -i 's/source.set({/source.set(({/g' "$NX_INT"
sed -i 's/  });/  }) as T);/g' "$NX_INT"

# Fix type annotations
sed -i 's/getState(): T || undefined;/getState(): T | undefined;/g' "$NX_INT"
sed -i 's/dispatch(action: any): void || undefined;/dispatch(action: any): void | undefined;/g' "$NX_INT"
sed -i 's/actionCreator: (payload: S) => { type: string || undefined; payload: S }/actionCreator: (payload: S) => { type: string | undefined; payload: S }/g' "$NX_INT"

echo "Fixed specific issues in signals files."
