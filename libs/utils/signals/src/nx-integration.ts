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

/**
 * Nx Signal Store Integration
 * 
 * This module provides utilities to integrate signals with NgRx or other
 * state management libraries used within the Nx ecosystem.
 */

import { createSignal, Signal, derivedSignal } from '../index';

/**
 * State store interface
 */
export interface Store<T> {
  /** Get current state */
  getState(): T;
  /** Subscribe to state changes */
  subscribe(listener: () => void): () => void;
  /** Dispatch an action */
  dispatch(action: any): void;
}

/**
 * Create a signal from a Redux/NgRx store
 * 
 * @param store - The store to connect to
 * @param selector - Optional selector function to get a slice of state
 * @returns A read-only signal that updates when the store changes
 */
export function signalFromStore<T, S = T>(
  store: Store<T>,
  selector: (state: T) => S = (state: T) => state as unknown as S
): Omit<Signal<S>, 'set'> {
  const signal = createSignal<S>(selector(store.getState()));
  
  const unsubscribe = store.subscribe(() => {
    signal.set(selector(store.getState()));
  });
  
  // Add a cleanup method to prevent memory leaks
  const originalSubscribe = signal.subscribe;
  let subscriberCount = 0;
  
  signal.subscribe = (callback) => {
    subscriberCount++;
    const unsubscribeSignal = originalSubscribe(callback);
    
    return () => {
      unsubscribeSignal();
      subscriberCount--;
      
      // If no more subscribers, unsubscribe from the store
      if (subscriberCount === 0) {
        unsubscribe();
      }
    };
  };
  
  return {
    get: signal.get,
    subscribe: signal.subscribe
  };
}

/**
 * Create an action dispatcher that adds tracing metadata
 * 
 * This is a utility function for creating action dispatchers in an Nx-based project
 * that adds automatic tracing metadata to help with debugging and performance monitoring.
 * 
 * @param actionName - The name of the action to dispatch
 * @param projectName - The name of the project this action belongs to
 * @returns A function that dispatches the action with tracing information
 */
// Helper function to create a strongly-typed action dispatcher
export function createActionDispatcher<T>(): (action: T) => void {
  return (action: T) => {
    console.log('Dispatching action:', action);
    // Implement action dispatch logic here
  };
}

/**
 * Connect a signal to a store for two-way binding
 * 
 * @param store - The store to connect to
 * @param selector - Selector function to get a slice of state
 * @param actionCreator - Function that creates an action to update the state
 * @returns A signal that reads from and writes to the store
 */
export function connectSignalToStore<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  actionCreator: (payload: S) => { type: string; payload: S }
): Signal<S> {
  const storeSignal = signalFromStore(store, selector);
  
  return {
    get: storeSignal.get,
    set: (newValue: S) => {
      store.dispatch(actionCreator(newValue));
    },
    subscribe: storeSignal.subscribe
  };
}

/**
 * Create a signal that maps to a specific property path in an object
 * 
 * @param source - Source signal containing an object
 * @param path - Property path (dot notation)
 * @returns A signal for the nested property
 */
export function propertySignal<T, K extends keyof T>(
  source: Signal<T>,
  property: K
): Signal<T[K]> {
  const derived = derivedSignal([source], (sourceValue) => sourceValue[property]);
  
  return {
    get: derived.get,
    subscribe: derived.subscribe,
    set: (newValue: T[K]) => {
      const current = source.get();
      source.set({
        ...current,
        [property]: newValue
      });
    }
  };
}
