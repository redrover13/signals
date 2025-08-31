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

/**
 * Signals Management Utility for Dulce de Saigon F&B Data Platform
 * 
 * This module provides utility functions for creating, managing, and monitoring
 * signals across the application. Signals are used for reactive programming
 * patterns in our TypeScript-based application.
 */

import { useEffect, useState } from 'react';

/**
 * Signal interface representing a reactive value
 */
export interface Signal<T> {
  /** Get the current value */
  get(): T;
  /** Update the signal value */
  set(newValue: T): void;
  /** Subscribe to value changes */
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * Create a new signal with the specified initial value
 * 
 * @param initialValue - The initial value for the signal
 * @returns A Signal object with get/set methods and subscription capability
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  return {
    get: () => value,
    set: (newValue: T) => {
      value = newValue;
      subscribers.forEach(callback => callback(value));
    },
    subscribe: (callback: (value: T) => void) => {
      subscribers.add(callback);
      // Return unsubscribe function
      return () => {
        subscribers.delete(callback);
      };
    }
  };
}

/**
 * Create a derived signal that depends on one or more other signals
 * 
 * @param dependencies - Array of signals this derived signal depends on
 * @param derivationFn - Function that calculates the derived value
 * @returns A read-only signal
 */
export function derivedSignal<T, D extends Array<Signal<unknown>>>(
  dependencies: D,
  derivationFn: (...values: { [K in keyof D]: D[K] extends Signal<infer U> ? U : never }) => T
): Omit<Signal<T>, 'set'> {
  // Create a new signal for the derived value
  const derivedValue = createSignal<T>(
    derivationFn(...(dependencies.map(dep => dep.get()) as any))
  );
  
  // Subscribe to all dependencies
  // This creates unsubscribe functions that could be used for cleanup if needed
  dependencies.map((dep) => 
    dep.subscribe(() => {
      const values = dependencies.map(d => d.get());
      derivedValue.set(derivationFn(...(values as any)));
    })
  );
  
  // Return a read-only signal (without the set method)
  return {
    get: derivedValue.get,
    subscribe: derivedValue.subscribe
  };
}

/**
 * React hook to use a signal in components
 * 
 * @param signal - The signal to use in the component
 * @returns The current value of the signal
 */
export function useSignal<T>(signal: Signal<T>): [T, (value: T) => void] {
  const [value, setValue] = useState(signal.get());

  useEffect(() => {
    const unsubscribe = signal.subscribe(newValue => {
      setValue(newValue);
    });
    return unsubscribe;
  }, [signal]);

  return [value, signal.set];
}

/**
 * Batch multiple signal updates to prevent cascading updates
 * 
 * @param updateFn - Function that performs multiple signal updates
 */
export function batch(updateFn: () => void): void {
  // This is a simple implementation; a more complex one would queue updates
  updateFn();
}

/**
 * Create a signal that persists its value in local storage
 * 
 * @param key - Storage key
 * @param initialValue - Initial value if not found in storage
 * @returns A signal with persistence
 */
export function persistentSignal<T>(key: string, initialValue: T): Signal<T> {
  // Only use localStorage in browser environment
  const isClient = typeof window !== 'undefined';
  
  // Try to get initial value from storage
  let storedValue = initialValue;
  if (isClient) {
    try {
      const item = window.localStorage.getItem(key);
      storedValue = item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }
  
  const signal = createSignal<T>(storedValue);
  
  // Override the set method to also update localStorage
  const originalSet = signal.set;
  signal.set = (newValue: T) => {
    originalSet(newValue);
    if (isClient) {
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    }
  };
  
  return signal;
}

/**
 * Convert a Promise to a signal that updates when the promise resolves
 * 
 * @param promise - The promise to convert
 * @param initialValue - Optional initial value while promise is pending
 * @returns A signal that updates when the promise resolves
 */
export function fromPromise<T>(
  promise: Promise<T>, 
  initialValue?: T
): Signal<{ loading: boolean; data: T | undefined; error: Error | undefined }> {
  const signal = createSignal<{
    loading: boolean;
    data: T | undefined;
    error: Error | undefined;
  }>({
    loading: true,
    data: initialValue,
    error: undefined
  });
  
  promise
    .then((result: T) => {
      signal.set({
        loading: false,
        data: result,
        error: undefined
      });
    })
    .catch((error: unknown) => {
      signal.set({
        loading: false,
        data: undefined,
        error: error instanceof Error ? error : new Error(String(error))
      });
    });
  
  return signal;
}
