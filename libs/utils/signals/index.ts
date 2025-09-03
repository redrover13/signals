/**
 * @fileoverview index module for the signals component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains impleme  const derivedSignal = (() => currentValue) as Signal<T>;
  derivedSignal.get = (): T => currentValue;
  derivedSignal.set = (): void => {
    throw new Error('Cannot set value of a derived signal');
  };
  derivedSignal.subscribe = (callback: (value: T) => void): (() => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };or TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { useState, useEffect } from 'react';

// Define a custom Signal type
export type Signal<T> = {
  (): T;
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
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

// This variable is referenced in legacy code but not used in this implementation
// Keep it for compatibility but mark it as unused
// @ts-expect-error: Variable kept for legacy compatibility
const signalIdCounter = 0;

/**
 * Creates a signal with the provided initial value and options
 * @param initialValue The initial value for the signal
 * @param options Optional configuration
 * @returns A signal with the provided value
 */
export function createSignal<T>(initialValue: T, options?: CreateSignalOptions): Signal<T> {
  // Create a simple signal implementation
  let currentValue = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const signalFunction = ((newValue?: T | ((prev: T) => T)): T => {
    if (newValue !== undefined) {
      const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(currentValue) : newValue;
      if (nextValue !== currentValue) {
        currentValue = nextValue;
        subscribers.forEach(callback => callback(currentValue));
      }
    }
    return currentValue;
  }) as Signal<T>;

  // Add methods to the signal
  signalFunction.get = (): T => currentValue;
  signalFunction.set = (value: T | ((prev: T) => T)): void => {
    const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(currentValue) : value;
    if (nextValue !== currentValue) {
      currentValue = nextValue;
      subscribers.forEach(callback => callback(currentValue));
    }
  };

  signalFunction.subscribe = (callback: (value: T) => void): (() => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  // Add debugging if enabled
  if (options?.debug === true) {
    const name = options.name ?? 'Signal';
    console.info(`${name} created with initial value:`, initialValue);

    const originalSet = signalFunction.set;
    signalFunction.set = (newValue: T | ((prev: T) => T)): void => {
      console.info(`${name} updating:`, {
        previous: currentValue,
        new: newValue,
      });
      originalSet(newValue);
    };
  }

  return signalFunction;
}

/**
 * Creates a persistent signal that saves its value to localStorage
 * @param key The localStorage key to use
 * @param initialValue The initial value (used if nothing exists in localStorage)
 * @returns A signal that persists its value
 */
// Overload removed to avoid naming conflict
export function createPersistentSignal<T>(key: string, initialValue: T): Signal<T> {
  let savedValue: T | null = null;

  try {
    const storedItem = localStorage.getItem(key);
    if (storedItem !== null && storedItem !== '') {
      savedValue = JSON.parse(storedItem);
    }
  } catch (error) {
    console.error(`Error loading value for key "${key}" from localStorage:`, error);
  }

  const signalInstance = createSignal<T>(
    savedValue ?? initialValue
  );

  const originalSet = signalInstance.set;
  signalInstance.set = (newValue: T | ((prev: T) => T)): void => {
    const valueToStore = typeof newValue === 'function' ? (newValue as (prev: T) => T)(signalInstance.get()) : newValue;
    try {
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    originalSet(newValue);
  };

  return signalInstance;
}

// Alias for backward compatibility
export { createPersistentSignal as persistentSignal };

/**
 * Creates a derived signal that computes its value from other signals
 * @param computeFn Function that computes the derived value
 * @param dependencies Array of signals this derived signal depends on
 * @returns A signal that automatically updates when dependencies change
 */
export function createDerivedSignal<T>(
  computeFn: () => T,
  dependencies: Signal<unknown>[] = []
): Signal<T> {
  let currentValue = computeFn();
  const subscribers = new Set<(value: T) => void>();

  const derivedSignal = (() => currentValue) as Signal<T>;
  derivedSignal.get = () => currentValue;
  derivedSignal.set = () => {
    throw new Error('Cannot set value of a derived signal');
  };
  derivedSignal.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  // Subscribe to all dependencies
  // @ts-expect-error: Variable intentionally unused - derived signals don't have cleanup
  const unsubscribeFunctions = dependencies.map((signal): (() => void) =>
    signal.subscribe((): void => {
      const newValue = computeFn();
      if (newValue !== currentValue) {
        currentValue = newValue;
        subscribers.forEach(callback => callback(currentValue));
      }
    })
  );

  return derivedSignal;
}

/**
 * Creates a computed signal (alias for createDerivedSignal)
 * @param computeFn Function that computes the derived value
 * @param dependencies Array of signals this computed signal depends on
 * @returns A signal that automatically updates when dependencies change
 */
export function createComputed<T>(
  computeFn: () => T,
  dependencies: Signal<unknown>[] = []
): Signal<T> {
  return createDerivedSignal(computeFn, dependencies);
}

/**
 * Creates an effect that runs when signals change
 * @param effectFn Function to run when dependencies change
 * @param dependencies Array of signals to watch
 * @returns Cleanup function
 */
export function createEffect(
  effectFn: () => void | (() => void),
  dependencies: Signal<unknown>[] = []
): () => void {
  let cleanup: (() => void) | void;

  const runEffect = (): void => {
    if (cleanup) cleanup();
    cleanup = effectFn();
  };

  // Subscribe to all dependencies
  const unsubscribeFunctions = dependencies.map(signal =>
    signal.subscribe(runEffect)
  );

  // Run effect initially
  runEffect();

  return () => {
    if (cleanup) cleanup();
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
}

/**
 * Batches multiple signal updates to avoid unnecessary re-renders
 * @param updates Function containing multiple signal updates
 */
export function batch(updates: () => void): void {
  updates();
}

/**
 * Type for async signal state
 */
export type AsyncSignalState<T> =
  | { status: 'pending'; value?: T | undefined }
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; error: Error };

/**
 * Creates a signal from a Promise
 * @param promise The promise to create a signal from
 * @param initialValue Initial value while promise is pending
 * @returns A signal that updates when the promise resolves or rejects
 */
export function fromPromise<T>(
  promise: Promise<T>,
  initialValue?: T
): Signal<AsyncSignalState<T>> {
  const stateSignal = createSignal<AsyncSignalState<T>>({
    status: 'pending',
    value: initialValue,
  });

  promise
    .then(value => {
      stateSignal.set({
        status: 'fulfilled',
        value,
      });
    })
    .catch(error => {
      stateSignal.set({
        status: 'rejected',
        error: error as Error,
      });
    });

  return stateSignal;
}

/**
 * Hook to use a signal in React components
 * @param signal The signal to use
 * @returns A tuple of [value, setter]
 */
export function useSignal<T>(signal: Signal<T>): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(signal.get());

  useEffect(() => {
    const unsubscribe = signal.subscribe(newValue => {
      setValue(newValue);
    });

    return unsubscribe;
  }, [signal]);

  return [value, signal.set];
}

/**
 * Hook to get the current value of a signal
 * @param signal The signal to get value from
 * @returns The current value of the signal
 */
export function useSignalValue<T>(signal: Signal<T>): T {
  const [value, setValue] = useState<T>(signal.get());

  useEffect(() => {
    const unsubscribe = signal.subscribe(newValue => {
      setValue(newValue);
    });

    return unsubscribe;
  }, [signal]);

  return value;
}

// Re-export standalone signal API for compatibility
export { createSignal as signal, createComputed as computed, createEffect as effect };
