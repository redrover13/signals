#!/bin/bash

# Fix ESM Module Import References
# This script fixes import references between modules

# ANSI color codes for formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}=== Fixing ESM Module Import References ===${NC}\n"

# Fix angular-signal-adapter.ts imports
echo -e "${BOLD}${MAGENTA}Fixing libs/utils/signals/src/angular-signal-adapter.ts imports${NC}"

# Create a backup if it doesn't exist
if [ ! -f "libs/utils/signals/src/angular-signal-adapter.ts.bak" ]; then
  cp "libs/utils/signals/src/angular-signal-adapter.ts" "libs/utils/signals/src/angular-signal-adapter.ts.bak"
fi

# Fix the import statement
cat > "libs/utils/signals/src/angular-signal-adapter.ts" << 'EOL'
/**
 * Angular signal adapter
 * 
 * This module provides compatibility between our signal implementation
 * and Angular's signal API. It allows Angular components to consume our signals
 * and vice versa.
 * 
 * @module
 */

import { Signal, createSignal, createComputed, createEffect } from "../index.js";

/**
 * Enhanced signal interface that includes methods for our implementation
 */
export interface EnhancedSignal<T> extends Signal<T> {
  /**
   * Update the signal value
   */
  set: (value: T | ((prev: T) => T)) => void;
  
  /**
   * Get the current value
   */
  get: () => T;
  
  /**
   * Subscribe to changes
   */
  subscribe: (callback: (value: T) => void) => () => void;
}

/**
 * Create a signal with the Angular-compatible API
 */
export function signal<T>(initialValue: T): EnhancedSignal<T> {
  let currentValue = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const signalFunction = (() => currentValue) as EnhancedSignal<T>;

  signalFunction.set = (value: T | ((prev: T) => T)) => {
    const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(currentValue) : value;
    currentValue = nextValue;
    
    // Notify subscribers
    subscribers.forEach(callback => callback(currentValue));
  };

  signalFunction.get = () => currentValue;
  
  signalFunction.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  };

  return signalFunction;
}

/**
 * Create a computed signal with the Angular-compatible API
 */
export function computed<T>(derivationFn: () => T): EnhancedSignal<T> {
  let currentValue: T;
  let isDirty = true;
  const subscribers = new Set<(value: T) => void>();

  const computedSignal = (() => {
    if (isDirty) {
      currentValue = derivationFn();
      isDirty = false;
    }
    return currentValue;
  }) as EnhancedSignal<T>;

  computedSignal.get = () => {
    if (isDirty) {
      currentValue = derivationFn();
      isDirty = false;
    }
    return currentValue;
  };

  computedSignal.set = () => {
    throw new Error('Cannot set the value of a computed signal directly');
  };

  computedSignal.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  };

  // Mark as dirty whenever dependencies change
  // This is a simplified implementation
  setTimeout(() => {
    isDirty = true;
    subscribers.forEach(callback => callback(computedSignal.get()));
  }, 0);

  return computedSignal;
}

export type { Signal };
export { createComputed as computed, createEffect as effect, createSignal as signal };
EOL

echo -e "${GREEN}✓${NC} Fixed angular-signal-adapter.ts imports"

# Fix nx-integration.ts imports
echo -e "${BOLD}${MAGENTA}Fixing libs/utils/signals/src/nx-integration.ts imports${NC}"

# Create a backup if it doesn't exist
if [ ! -f "libs/utils/signals/src/nx-integration.ts.bak" ]; then
  cp "libs/utils/signals/src/nx-integration.ts" "libs/utils/signals/src/nx-integration.ts.bak"
fi

# Fix the import statement
cat > "libs/utils/signals/src/nx-integration.ts" << 'EOL'
/**
 * Integration with Nx tools
 * 
 * This module provides integration with Nx tools and libraries,
 * including Redux, NgRx, and other state management solutions.
 * 
 * @module
 */

import React from 'react';
import { Signal, createSignal } from "../index.js";

/**
 * Create a signal from a Redux store selector
 * 
 * @param store Redux store
 * @param selector Selector function
 * @param initialValue Initial value
 * @returns Signal bound to the store state
 */
export function createReduxSignal<S, T>(
  store: {
    getState: () => S;
    subscribe: (listener: () => void) => () => void;
  },
  selector: (state: S) => T,
  initialValue: T,
): Signal<T> {
  // Create a signal with the current state
  const initialState = selector(store.getState());
  const signalInstance = createSignal<T>(initialState !== undefined ? initialState : initialValue);

  // Subscribe to store changes
  store.subscribe(() => {
    const newValue = selector(store.getState());
    signalInstance.set(newValue);
  });

  return signalInstance;
}

/**
 * Create a signal from a Redux store selector with a mapping function
 * 
 * @param store Redux store
 * @param selector Selector function
 * @param mapper Mapping function
 * @param initialValue Initial value
 * @returns Signal bound to the mapped store state
 */
export function createMappedReduxSignal<S, R, T>(
  store: {
    getState: () => S;
    subscribe: (listener: () => void) => () => void;
  },
  selector: (state: S) => R,
  mapper: (selected: R) => T,
  initialValue: T,
): Signal<T> {
  // Get initial value
  const initialSelected = selector(store.getState());
  const initialMapped =
    initialSelected !== undefined && mapper ? mapper(initialSelected) : initialValue;

  const signalInstance = createSignal<T>(initialMapped);

  store.subscribe(() => {
    const newSelected = selector(store.getState());
    if (newSelected !== undefined && mapper) {
      const newMapped = mapper(newSelected);
      signalInstance.set(newMapped);
    }
  });

  return signalInstance;
}

/**
 * Higher-order component that connects Redux store to signals
 * 
 * @param mapStateToSignals Function that maps state to signals
 * @returns HOC function
 */
export function connectSignals<P, S>(
  mapStateToSignals: (store: {
    getState: () => S;
    subscribe: (listener: () => void) => () => void;
  }) => Record<string, Signal<unknown>>,
) {
  return function connectComponent(Component: React.ComponentType<P>) {
    return function ConnectedComponent(props: P) {
      const signalProps = mapStateToSignals({
        getState: () => ({} as S),
        subscribe: () => () => {},
      });
      
      return <Component {...props} {...signalProps} />;
    };
  };
}
EOL

echo -e "${GREEN}✓${NC} Fixed nx-integration.ts imports"

# Fix react-hooks.ts imports
echo -e "${BOLD}${MAGENTA}Fixing libs/utils/signals/src/react-hooks.ts imports${NC}"

# Create a backup if it doesn't exist
if [ ! -f "libs/utils/signals/src/react-hooks.ts.bak" ]; then
  cp "libs/utils/signals/src/react-hooks.ts" "libs/utils/signals/src/react-hooks.ts.bak"
fi

# Fix the import statement
cat > "libs/utils/signals/src/react-hooks.ts" << 'EOL'
/**
 * React hooks for signals
 * 
 * This module provides React hooks for using signals in React components.
 * 
 * @module
 */

import { useState, useEffect } from 'react';
import { EnhancedSignal } from "./angular-signal-adapter.js";

/**
 * React hook for using signals in React components
 * 
 * @param signal Signal to use
 * @returns Tuple of [value, setValue]
 */
export default function useSignal<T>(signal: EnhancedSignal<T>): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(signal.get());

  useEffect(() => {
    // Subscribe to signal changes
    const unsubscribe = signal.subscribe(newValue => {
      setValue(newValue);
    });

    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [signal]);

  return [value, (newValue: T) => signal.set(newValue)];
}
EOL

echo -e "${GREEN}✓${NC} Fixed react-hooks.ts imports"

echo -e "\n${BOLD}${GREEN}ESM module import references fixed!${NC}"
echo -e "Running build check again to verify fixes..."

# Run the build check script again
./build-check.sh
