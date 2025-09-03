/**
 * @fileoverview Enhanced signals index module
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for an enhanced TypeScript signals system.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Standalone signal implementation (no Angular dependency)
import { useState, useEffect, useRef, useCallback } from 'react';

// Basic Signal interface
interface BaseSignal<T> {
  (): T;
  set(value: T | ((prev: T) => T)): void;
}

// Enhanced Signal type with additional properties
export type Signal<T> = BaseSignal<T> & {
  // Better type safety for method signatures
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (callback: (value: T) => void) => () => void;

  // Add metadata for debugging
  readonly __id: string;
  readonly __debugName?: string;
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
  
  /**
   * Enable deep equality check before updating
   */
  deepEqual?: boolean;
  
  /**
   * Custom equality function
   */
  equals?: <T>(a: T, b: T) => boolean;
}

// Internal counter for generating unique IDs
let signalIdCounter = 0;

/**
 * Simple deep equality check for objects
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Creates a signal with the provided initial value and options
 * @param initialValue The initial value for the signal
 * @param options Optional configuration
 * @returns A signal with the provided value
 */
export function createSignal<T>(initialValue: T, options?: CreateSignalOptions): Signal<T> {
  const signalId = `DDS-signal-${++signalIdCounter}`;

  // Create a simple signal implementation
  let currentValue = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const signalFunction = ((newValue?: T | ((prev: T) => T)) => {
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
  signalFunction.get = () => currentValue;
  signalFunction.set = (value: T | ((prev: T) => T)) => {
    const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(currentValue) : value;

    // Check for equality based on options
    let hasChanged = true;
    if (options?.deepEqual) {
      hasChanged = !deepEqual(currentValue, nextValue);
    } else if (options?.equals) {
      hasChanged = !options.equals(currentValue, nextValue);
    } else {
      hasChanged = nextValue !== currentValue;
    }

    if (hasChanged) {
      currentValue = nextValue;
      subscribers.forEach(callback => callback(currentValue));
    }
  };

  signalFunction.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  // Add metadata
  Object.defineProperty(signalFunction, '__id', {
    value: signalId,
    writable: false,
    enumerable: false,
  });

  if (options?.name) {
    Object.defineProperty(signalFunction, '__debugName', {
      value: options.name,
      writable: false,
      enumerable: false,
    });
  }

  return signalFunction;
}

/**
 * Creates a computed signal that automatically updates when dependencies change
 * @param computeFn Function that computes the value
 * @param options Optional configuration
 * @returns A computed signal
 */
export function createComputed<T>(computeFn: () => T, options?: CreateSignalOptions): Signal<T> {
  const signalId = `DDS-computed-${++signalIdCounter}`;
  let currentValue: T;
  let isDirty = true;
  const subscribers = new Set<(value: T) => void>();

  const computedSignal = (() => {
    if (isDirty) {
      currentValue = computeFn();
      isDirty = false;
    }
    return currentValue;
  }) as Signal<T>;

  computedSignal.get = () => {
    if (isDirty) {
      currentValue = computeFn();
      isDirty = false;
    }
    return currentValue;
  };

  computedSignal.set = () => {
    throw new Error('Cannot set value of computed signal');
  };

  computedSignal.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  // Add metadata
  Object.defineProperty(computedSignal, '__id', {
    value: signalId,
    writable: false,
    enumerable: false,
  });

  if (options?.name) {
    Object.defineProperty(computedSignal, '__debugName', {
      value: options.name,
      writable: false,
      enumerable: false,
    });
  }

  return computedSignal;
}



/**
 * React hook to use a signal in React components
 * @param signal The signal to use
 * @returns [value, setValue] tuple with memoized setter
 */
export function useSignal<T>(
  signal: Signal<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(signal.get());

  const signalRef = useRef(signal);
  signalRef.current = signal;

  useEffect(() => {
    const unsubscribe = signalRef.current.subscribe(newValue => {
      setValue(newValue);
    });

    const currentValue = signalRef.current.get();
    if (value !== currentValue) {
      setValue(currentValue);
    }

    return () => {
      unsubscribe();
    };
  }, [signal, value]);

  const setSignalValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      signalRef.current.set(newValue);
    },
    []
  );

  return [value, setSignalValue];
}

// Re-export Angular signal API for compatibility
// Note: These are now standalone implementations, not Angular dependencies
export { createSignal as signal, createComputed as computed };

// Create a simple effect implementation
export function effect(callback: () => void): { destroy: () => void } {
  callback(); // Run immediately
  return { destroy: () => {} }; // No-op destroy for now
}

// Friendly alias to match docs/tests
export const createComputedAlias = <T>(fn: () => T) => createComputed<T>(fn);

// Export additional types for better developer experience
export type SignalOptions = CreateSignalOptions;
export type SignalValue<S> = S extends Signal<infer T> ? T : never;
export type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;