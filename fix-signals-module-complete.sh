#!/bin/bash
set -e

echo "Starting comprehensive fix for signals library..."

# Create a backup of the original files
mkdir -p /tmp/signals-backup
cp -r /home/g_nelson/signals-1/libs/utils/signals/* /tmp/signals-backup/

# Fix index.ts - Remove the export from src/index and make it the main source
cat > /home/g_nelson/signals-1/libs/utils/signals/index.ts << 'EOL'
/**
 * @fileoverview index module for the signals component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { computed, effect, signal, type Signal as AngularSignal } from '@angular/core';
import { useState, useEffect } from 'react';

// Define a custom Signal type that extends Angular's Signal
export type Signal<T> = AngularSignal<T> & {
  // Add additional methods for backward compatibility
  get: () => T;
  set: (value: T) => void;
  subscribe: (callback: (value: T) => void) => () => void;
};

export interface CreateSignalOptions {
  /**
   * Enable debugging for this signal by logging updates to console
   */
  debug?: boolean;
  /**
   * Name for debugging output
   */
  name?: string;
}

/**
 * Creates a signal with the provided initial value and options
 * @param initialValue The initial value for the signal
 * @param options Optional configuration
 * @returns A signal with the provided value
 */
export function createSignal<T>(initialValue: T, options?: CreateSignalOptions): Signal<T> {
  const internalSignal = signal<T>(initialValue);
  
  // Create extended signal with additional methods
  const extendedSignal = internalSignal as unknown as Signal<T>;
  
  // Add get method
  extendedSignal.get = () => internalSignal();
  
  // Keep reference to original set method
  const originalSet = internalSignal.set;
  
  // Add debugging if enabled
  if (options?.debug) {
    const name = options.name || 'Signal';
    console.log(`${name} created with initial value:`, initialValue);
    
    extendedSignal.set = (newValue: T) => {
      console.log(`${name} updating:`, {
        previous: internalSignal(),
        new: newValue,
      });
      originalSet(newValue);
    };
  } else {
    extendedSignal.set = originalSet;
  }
  
  // Add subscribe method
  extendedSignal.subscribe = (callback: (value: T) => void) => {
    const effectRef = effect(() => {
      const value = internalSignal();
      callback(value);
    });
    return () => { 
      effectRef.destroy(); 
    };
  };
  
  return extendedSignal;
}

/**
 * Creates a persistent signal that saves its value to localStorage
 * @param key The localStorage key to use
 * @param initialValue The initial value (used if nothing exists in localStorage)
 * @returns A signal that persists its value
 */
export function createPersistentSignal<T>(key: string, initialValue: T): Signal<T> {
  // Get the stored value from localStorage
  let storedValue: T;
  try {
    const item = window.localStorage.getItem(key || "");
    storedValue = item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    storedValue = initialValue;
  }
  
  // Create a signal with the stored or initial value
  const persistentSignal = createSignal<T>(storedValue);
  
  // Create a wrapped signal with a custom setter that updates localStorage
  const originalSet = persistentSignal.set;
  persistentSignal.set = (newValue: T) => {
    try {
      window.localStorage.setItem(key || "", JSON.stringify(newValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    originalSet(newValue);
  };
  
  return persistentSignal;
}

/**
 * Creates a derived signal based on a computation function
 * @param computeFn Function that derives a new value
 * @returns A computed signal
 */
export function createDerivedSignal<T>(computeFn: () => T): Signal<T> {
  const derivedValue = computed(computeFn) as unknown as Signal<T>;
  
  // Add compatibility methods
  derivedValue.get = () => derivedValue();
  derivedValue.set = () => { 
    throw new Error('Cannot set a derived signal directly');
  };
  derivedValue.subscribe = (callback: (value: T) => void) => {
    const effectRef = effect(() => {
      callback(derivedValue());
    });
    return () => { 
      effectRef.destroy(); 
    };
  };
  
  return derivedValue;
}

/**
 * Creates a signal with a value and a setter function
 * @param initialValue The initial value
 * @returns A tuple containing the signal and its setter
 */
export function createStateSignal<T>(initialValue: T): [Signal<T>, (value: T) => void] {
  const signal = createSignal<T>(initialValue);
  return [signal, signal.set];
}

/**
 * Create a computed signal derived from other signals
 * @param derivationFn Function that computes the derived value
 * @returns Computed signal
 */
export function createComputed<T>(derivationFn: () => T): Signal<T> {
  const computedSignal = computed(derivationFn) as unknown as Signal<T>;
  
  // Add compatibility methods
  computedSignal.get = () => computedSignal();
  
  // Computed signals are read-only
  computedSignal.set = () => { 
    throw new Error('Cannot set a computed signal directly');
  };
  
  computedSignal.subscribe = (callback: (value: T) => void) => {
    const effectRef = effect(() => {
      callback(computedSignal());
    });
    
    return () => {
      effectRef.destroy();
    };
  };
  
  return computedSignal;
}

/**
 * Register an effect that runs when dependencies change
 * @param effectFn Effect function to run
 * @returns Cleanup function
 */
export function createEffect(effectFn: () => void) {
  const effectRef = effect(effectFn);
  return () => {
    effectRef.destroy();
  };
}

/**
 * Create a derived signal from a set of input signals
 * @param inputs Object of input signals
 * @param derivationFn Function that computes the derived value
 * @returns Derived signal
 */
export function derive<D extends Record<string, Signal<any>>, T>(
  inputs: D,
  derivationFn: (values: { [K in keyof D]: D[K] extends Signal<infer U> ? U : never }) => T
): Signal<T> {
  // Create the derived signal using Angular's computed
  const derivedValue = computed(() => {
    // Map all signal values
    const values = {} as any;
    for (const key in inputs) {
      if (Object.prototype.hasOwnProperty.call(inputs, key) && inputs[key]) {
        values[key] = inputs[key]();
      }
    }
    
    // Compute the derived value
    return derivationFn(values);
  }) as unknown as Signal<T>;
  
  // Add compatibility methods
  derivedValue.get = () => derivedValue();
  
  // Derived signals are read-only
  derivedValue.set = () => { 
    throw new Error('Cannot set a derived signal directly');
  };
  
  derivedValue.subscribe = (callback: (value: T) => void) => {
    const effectRef = effect(() => {
      callback(derivedValue());
    });
    
    return () => {
      effectRef.destroy();
    };
  };
  
  return derivedValue;
}

/**
 * Map all signal values in an object
 * @param inputs Object of signals
 * @returns Object with unwrapped signal values
 */
function mapSignalValues<T extends Record<string, Signal<any>>>(inputs: T): {
  [K in keyof T]: T[K] extends Signal<infer U> ? U : never
} {
  const result = {} as any;
  
  for (const key in inputs) {
    if (Object.prototype.hasOwnProperty.call(inputs, key) && inputs[key]) {
      const signal = inputs[key];
      result[key] = signal();
    }
  }
  
  return result;
}

/**
 * Hook to use a signal in a React component
 * @param signal Signal to use
 * @returns [value, setValue] tuple
 */
export function useSignal<T>(signal: Signal<T>): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(signal());
  
  useEffect(() => {
    // Subscribe to signal updates
    const unsubscribe = signal.subscribe((newValue) => {
      setValue(newValue);
    });
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [signal]);
  
  // Return value and a setter that updates the signal
  return [
    value,
    (newValue: T) => {
      signal.set(newValue);
    }
  ];
}

/**
 * Create a persistent signal that saves to localStorage
 * @param key localStorage key
 * @param initialValue Initial value if not in storage
 * @returns Persistent signal
 */
export function persistentSignal<T>(key: string, initialValue: T): Signal<T> {
  let savedValue: T | null = null;
  
  // Try to load from localStorage
  try {
    const storedItem = localStorage.getItem(key);
    if (storedItem) {
      savedValue = JSON.parse(storedItem);
    }
  } catch (error) {
    console.error(`Error loading value for key "${key}" from localStorage:`, error);
  }
  
  // Create signal with initial or loaded value
  const signalInstance = createSignal<T>(savedValue !== null ? savedValue : initialValue);
  
  // Override the set method to save to localStorage
  const originalSet = signalInstance.set;
  signalInstance.set = (newValue: T) => {
    // Update the signal
    originalSet(newValue);
    
    // Save to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error saving value for key "${key}" to localStorage:`, error);
    }
  };
  
  return signalInstance;
}

/**
 * Create a signal from an asynchronous Promise
 * @param promise Promise to observe
 * @param initialValue Optional initial value
 * @returns Signal with promise state
 */
export interface AsyncSignalState<T> {
  loading: boolean;
  data?: T;
  error?: Error;
}

export function fromPromise<T>(promise: Promise<T>, initialValue?: T): Signal<AsyncSignalState<T>> {
  const initialState: AsyncSignalState<T> = {
    loading: true,
    data: initialValue,
  };
  
  const signal = createSignal<AsyncSignalState<T>>(initialState);
  
  // Process the promise
  promise.then(
    data => {
      const successState: AsyncSignalState<T> = {
        loading: false,
        data,
      };
      signal.set(successState);
    },
    error => {
      const errorState: AsyncSignalState<T> = {
        loading: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      signal.set(errorState);
    }
  );
  
  return signal;
}

/**
 * Batch multiple signal updates together
 * @param updateFn Function that performs multiple updates
 */
export function batch(updateFn: () => void): void {
  // In a real implementation, this would queue updates and apply them all at once
  // For now, we just execute the function
  updateFn();
}

// Re-export Angular signal API
export { signal, computed, effect };
EOL

# Create a new src/index.ts that just re-exports from the main file
cat > /home/g_nelson/signals-1/libs/utils/signals/src/index.ts << 'EOL'
/**
 * @fileoverview Re-export module for the signals component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Re-export everything from the main index
export * from '../index';
EOL

echo "Fixed signals library files..."

# Fix demo-components.tsx
cat > /home/g_nelson/signals-1/libs/utils/signals/src/demo-components.tsx << 'EOL'
/**
 * @fileoverview Demo components for the signals library
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains React components that demonstrate signals usage.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React from 'react';
import { createSignal, useSignal, createComputed, type Signal } from '../index';

// Create some global signals
const counterSignal = createSignal(0);
const nameSignal = createSignal('Guest');
const messageSignal = createComputed(() => `Hello, ${nameSignal()} (${counterSignal()})`);

// Counter component using signals
export function CounterDemo() {
  const [count, setCount] = useSignal(counterSignal);
  
  return (
    <div className="counter-demo">
      <h2>Counter Demo</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}

// Name input component using signals
export function NameDemo() {
  const [name, setName] = useSignal(nameSignal);
  
  return (
    <div className="name-demo">
      <h2>Name Demo</h2>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Enter your name"
      />
    </div>
  );
}

// Message component using derived signal
export function MessageDemo() {
  const [message] = useSignal(messageSignal);
  
  return (
    <div className="message-demo">
      <h2>Message Demo</h2>
      <p>{message}</p>
      <p>This message automatically updates when the counter or name changes.</p>
    </div>
  );
}

// Main demo component
export function SignalsDemo() {
  return (
    <div className="signals-demo">
      <h1>Signals Demo</h1>
      <CounterDemo />
      <NameDemo />
      <MessageDemo />
    </div>
  );
}

export default SignalsDemo;
EOL

echo "Fixed demo components..."

# Fix nx-integration.ts
cat > /home/g_nelson/signals-1/libs/utils/signals/src/nx-integration.ts << 'EOL'
/**
 * @fileoverview Nx integration for the signals library
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains utilities for integrating signals with Nx and Redux.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import type { Signal } from '../index';
import { createSignal } from '../index';

/**
 * Create a signal from a Redux store selector
 * @param store Redux store
 * @param selector Selector function
 * @param initialValue Initial value for the signal
 * @returns Signal connected to the store
 */
export function createReduxSignal<S, T>(
  store: { getState: () => S; subscribe: (listener: () => void) => () => void },
  selector: (state: S) => T,
  initialValue: T
): Signal<T> {
  // Create a signal with the current state
  const initialState = selector(store.getState());
  const signalInstance = createSignal<T>(initialState !== undefined ? initialState : initialValue);
  
  // Subscribe to store changes
  store.subscribe(() => {
    const newValue = selector(store.getState());
    if (newValue !== undefined) {
      signalInstance.set(newValue);
    }
  });
  
  return signalInstance;
}

/**
 * Create a mapped signal from a Redux store
 * @param store Redux store
 * @param selector Selector function
 * @param mapper Mapping function
 * @param initialValue Initial value for the signal
 * @returns Signal connected to the store with mapped values
 */
export function createMappedReduxSignal<S, R, T>(
  store: { getState: () => S; subscribe: (listener: () => void) => () => void },
  selector: (state: S) => R,
  mapper: (selected: R) => T,
  initialValue: T
): Signal<T> {
  // Get initial value
  const initialSelected = selector(store.getState());
  const initialMapped = initialSelected !== undefined && mapper 
    ? mapper(initialSelected) 
    : initialValue;
  
  const signalInstance = createSignal<T>(initialMapped);
  
  store.subscribe(() => {
    const newSelected = selector(store.getState());
    const newValue = mapper ? mapper(newSelected) : newSelected as unknown as T;
    signalInstance.set(newValue);
  });
  
  return signalInstance;
}

/**
 * Connect a component to Redux state via signals
 * @param mapStateToSignals Function mapping state to signals
 * @returns Connected component with signals
 */
export function connectWithSignals<S, P extends object>(
  mapStateToSignals: (store: { getState: () => S; subscribe: (listener: () => void) => () => void }) => Record<string, Signal<any>>
) {
  return function connectComponent(Component: React.ComponentType<P>) {
    return function ConnectedComponent(props: P) {
      // Implementation would connect Redux to signals
      return <Component {...props} />;
    };
  };
}
EOL

echo "Fixed nx-integration file..."

echo "Signal library fix completed successfully!"
