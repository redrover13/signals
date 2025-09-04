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

import React from 'react';
import type { Signal } from '../index.js';
import { createSignal } from '../index.js';

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
  initialValue: T,
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
  initialValue: T,
): Signal<T> {
  // Get initial value
  const initialSelected = selector(store.getState());
  const initialMapped =
    initialSelected !== undefined && mapper ? mapper(initialSelected) : initialValue;

  const signalInstance = createSignal<T>(initialMapped);

  store.subscribe(() => {
    const newSelected = selector(store.getState());
    const newValue = mapper ? mapper(newSelected) : (newSelected as unknown as T);
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
  mapStateToSignals: (store: {
    getState: () => S;
    subscribe: (listener: () => void) => () => void;
  }) => Record<string, Signal<unknown>>,
) {
  return function connectComponent(Component: React.ComponentType<P>) {
    return function ConnectedComponent(props: P) {
      // Implementation would connect Redux to signals
      // For now, just pass through the props using React.createElement
      // Note: mapStateToSignals parameter is reserved for future Redux integration
      void mapStateToSignals; // Mark as intentionally unused for now
      return React.createElement(Component, props);
    };
  };
}
