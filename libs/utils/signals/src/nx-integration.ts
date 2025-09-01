/**
 * @fileoverview nx-integration module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

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
