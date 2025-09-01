#!/bin/bash

# Script to fix signals/index.ts
echo "🔧 Fixing Signals Index..."

# Create a directory if it doesn't exist
mkdir -p ./libs/utils/signals

# Create the fixed file
cat > ./libs/utils/signals/index.ts.new << 'EOF2'
/**
 * Signals implementation for Dulce Saigon
 */

/**
 * Signal interface for reactive state management
 */
export interface Signal<T> {
  /**
   * Get the current value of the signal
   */
  (): T;
  
  /**
   * Set a new value for the signal
   */
  set: (value: T) => void;
  
  /**
   * Subscribe to value changes
   */
  subscribe: (callback: (value: T) => void) => () => void;
  
  /**
   * Get the name of the signal (for debugging)
   */
  name?: string;
}

/**
 * Creates a signal with the given initial value
 * @param initialValue The initial value of the signal
 * @param name Optional name for debugging
 */
export function createSignal<T>(initialValue: T, name?: string): Signal<T> {
  let value = initialValue;
  const subscribers: ((value: T) => void)[] = [];
  
  const signal = (() => value) as Signal<T>;
  
  signal.set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      subscribers.forEach(callback => callback(value));
    }
  };
  
  signal.subscribe = (callback: (value: T) => void) => {
    subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  };
  
  if (name) {
    signal.name = name;
  }
  
  return signal;
}

/**
 * Creates a derived signal that depends on other signals
 * @param dependencies The signals that this signal depends on
 * @param derivationFn Function that computes the derived value
 */
export function derived<T, D extends Record<string, Signal<any>>>(
  dependencies: D,
  derivationFn: (values: { [K in keyof D]: D[K] extends Signal<infer U> ? U : never }) => T
): Omit<Signal<T>, 'set'> {
  // Create a signal with the initial derived value
  const derivedValue = createSignal<T>(
    derivationFn(getDependencyValues(dependencies))
  );
  
  // Subscribe to all dependencies
  Object.values(dependencies).forEach(dep => {
    dep.subscribe(() => {
      derivedValue.set(derivationFn(getDependencyValues(dependencies)));
    });
  });
  
  // Return readonly signal (without set method)
  return {
    name: derivedValue.name,
    subscribe: derivedValue.subscribe,
    // Using function call operator to get the value
    (): T => derivedValue(),
  };
}

/**
 * Helper to get current values from dependency signals
 * @param dependencies Object with signal dependencies
 */
function getDependencyValues<D extends Record<string, Signal<any>>>(dependencies: D): 
  { [K in keyof D]: D[K] extends Signal<infer U> ? U : never } {
  
  const values = {} as { [K in keyof D]: D[K] extends Signal<infer U> ? U : never };
  
  for (const key in dependencies) {
    if (Object.prototype.hasOwnProperty.call(dependencies, key)) {
      const signal = dependencies[key];
      values[key] = signal();
    }
  }
  
  return values;
}

/**
 * Creates a computed signal that depends on other signals
 * Alias for derived
 */
export const computed = derived;

/**
 * Batch multiple signal updates to trigger subscriptions only once at the end
 * @param updateFn Function that performs multiple signal updates
 */
export function batch(updateFn: () => void): void {
  // In a more advanced implementation, this would
  // temporarily disable subscription notifications
  // For now, we just execute the function
  updateFn();
}
EOF2

# Replace the file
mv ./libs/utils/signals/index.ts.new ./libs/utils/signals/index.ts

echo "✅ Signals Index fixed!"
