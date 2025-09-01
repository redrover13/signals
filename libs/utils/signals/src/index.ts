/**
 * @fileoverview index module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Angular Signals implementation
 */
import { Signal, computed as angularComputed, effect as angularEffect, signal as angularSignal } from '@angular/core';
import { useState, useEffect } from 'react';

/**
 * Create a signal with the given initial value
 * @param initialValue Initial value for the signal
 * @returns Signal instance
 */
export function createSignal<T>(initialValue: T) {
  const signalInstance = angularSignal<T>(initialValue);
  
  // Extend with subscribe method for backward compatibility
  const extendedSignal = signalInstance as Signal<T> & {
    subscribe: (callback: (value: T) => void) => () => void;
    get: () => T;
    set: (value: T) => void;
  };
  
  extendedSignal.subscribe = (callback: (value: T) => void) => {
    const unsubscribe = angularEffect(() => {
      callback(signalInstance());
    });
    return unsubscribe;
  };
  
  extendedSignal.get = () => signalInstance();
  extendedSignal.set = (value: T) => signalInstance.set(value);
  
  return extendedSignal;
}

/**
 * Create a computed signal derived from other signals
 * @param derivationFn Function that computes the derived value
 * @returns Computed signal
 */
export function createComputed<T>(derivationFn: () => T) {
  return angularComputed<T>(derivationFn);
}

/**
 * Register an effect that runs when dependencies change
 * @param effectFn Effect function to run
 * @returns Cleanup function
 */
export function createEffect(effectFn: () => void) {
  return angularEffect(effectFn);
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
): Omit<Signal<T>, 'set'> {
  // Create the derived signal
  const derivedValue = createSignal<T>(
    derivationFn(mapSignalValues(inputs))
  );
  
  // Track dependencies
  const dependencies = Object.values(inputs);
  
  // Set up effect to update the derived value
  if (dependencies) {
    dependencies.forEach((dep) => {
      createEffect(() => {
        const values = mapSignalValues(inputs);
        const newValue = derivationFn(values);
        derivedValue.set(newValue);
      });
    });
  }
  
  // Remove the set method to make it read-only
  const { set, ...readOnlySignal } = derivedValue as any;
  
  return readOnlySignal;
}

/**
 * Helper to map signal objects to their current values
 */
function mapSignalValues<D extends Record<string, Signal<any>>>(
  inputs: D
): { [K in keyof D]: D[K] extends Signal<infer U> ? U : never } {
  const result: any = {};
  
  for (const key in inputs) {
    if (Object.prototype.hasOwnProperty.call(inputs, key)) {
      const signal = inputs[key];
      result[key] = signal();
    }
  }
  
  return result;
}

/**
 * Create a mutable signal that can be set
 * @param initialValue Initial value
 * @returns Mutable signal
 */
export function mutable<T>(initialValue: T): Signal<T> & { set: (newValue: T) => void } {
  const signal = createSignal<T>(initialValue);
  return signal;
}

/**
 * Create a signal that can only be set once
 * @param initialValue Initial value
 * @returns Signal that can only be set once
 */
export function immutable<T>(initialValue: T): Signal<T> {
  return createSignal<T>(initialValue);
}

/**
 * Create a derived signal from input signals
 * @param inputs Array of input signals
 * @param derivationFn Function to compute derived value
 * @returns Derived signal
 */
export function derivedSignal<T extends any[], R>(
  inputs: [...{ [K in keyof T]: Signal<T[K]> }],
  derivationFn: (...args: T) => R
) {
  const derived = createSignal<R>(
    derivationFn(...inputs.map(signal => signal.get()) as T)
  );
  
  inputs.forEach(signal => {
    signal.subscribe(() => {
      derived.set(derivationFn(...inputs.map(s => s.get()) as T));
    });
  });
  
  return derived;
}

/**
 * React hook to use a signal in a React component
 * @param signal Signal to use
 * @returns Tuple of [value, setter]
 */
export function useSignal<T>(signal: Signal<T> & { get: () => T, set: (value: T) => void }): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(signal.get());
  
  useEffect(() => {
    const unsubscribe = signal.subscribe(newValue => {
      setValue(newValue);
    });
    return unsubscribe;
  }, [signal]);
  
  const setter = (newValue: T) => {
    signal.set(newValue);
  };
  
  return [value, setter];
}

/**
 * Batch multiple signal updates
 * @param fn Function that performs multiple updates
 */
export function batch(fn: () => void) {
  fn();
}

/**
 * Create a signal with persistent storage in localStorage
 * @param key Storage key
 * @param initialValue Initial value
 * @returns Persistent signal
 */
export function persistentSignal<T>(key: string, initialValue: T) {
  let savedValue: T | null = null;
  
  // Try to load from localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item) {
        savedValue = JSON.parse(item);
      }
    }
  } catch (e) {
    console.error('Error loading from localStorage:', e);
  }
  
  const signal = createSignal<T>(savedValue !== null ? savedValue : initialValue);
  
  // Subscribe to changes and persist to localStorage
  signal.subscribe(value => {
    if (typeof window !== 'undefined' && window.localStorage && key) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  });
  
  return signal;
}

/**
 * Create a signal from a Promise
 * @param promise Promise to convert to signal
 * @param initialValue Optional initial value
 * @returns Signal with promise state
 */
export function fromPromise<T>(promise: Promise<T>, initialValue?: T) {
  const signal = createSignal<{ loading: boolean, data?: T, error?: Error }>({
    loading: true,
    data: initialValue,
    error: undefined
  });
  
  promise.then(
    data => {
      signal.set({
        loading: false,
        data,
        error: undefined
      });
    },
    error => {
      signal.set({
        loading: false,
        data: undefined,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  );
  
  return signal;
}

export { Signal, angularComputed as computed, angularEffect as effect, angularSignal as signal };
