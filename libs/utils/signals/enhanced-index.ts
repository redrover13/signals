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

import { computed, effect, signal, type Signal as AngularSignal } from '@angular/core';
import { useState, useEffect, useRef, useCallback } from 'react';

// Enhanced Signal type with additional properties
export type Signal<T> = AngularSignal<T> & {
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
  equals?: (a: any, b: any) => boolean;
}

// Internal counter for generating unique IDs
let signalIdCounter = 0;

/**
 * Creates a signal with the provided initial value and options
 * @param initialValue The initial value for the signal
 * @param options Optional configuration
 * @returns A signal with the provided value
 */
export function createSignal<T>(initialValue: T, options?: CreateSignalOptions): Signal<T> {
  const signalId = `signal_${++signalIdCounter}`;
  const internalSignal = signal<T>(initialValue);
  
  // Create extended signal with additional methods
  const extendedSignal = internalSignal as unknown as Signal<T>;
  
  // Add metadata
  Object.defineProperty(extendedSignal, '__id', {
    value: signalId,
    writable: false,
    enumerable: false,
  });
  
  if (options?.name) {
    Object.defineProperty(extendedSignal, '__debugName', {
      value: options.name,
      writable: false,
      enumerable: false,
    });
  }
  
  // Add get method
  extendedSignal.get = () => internalSignal();
  
  // Keep reference to original set method
  const originalSet = internalSignal.set;
  
  // Enhanced set method that supports functional updates
  extendedSignal.set = (newValue: T | ((prev: T) => T)) => {
    if (typeof newValue === 'function') {
      // Handle functional updates like React's setState
      const updateFn = newValue as (prev: T) => T;
      const currentValue = internalSignal();
      const nextValue = updateFn(currentValue);
      
      // Skip update if values are equal (when enabled)
      if (options?.deepEqual && areEqual(currentValue, nextValue, options?.equals)) {
        return;
      }
      
      originalSet(nextValue);
    } else {
      // Skip update if values are equal (when enabled)
      if (options?.deepEqual && areEqual(internalSignal(), newValue, options?.equals)) {
        return;
      }
      
      originalSet(newValue);
    }
  };
  
  // Add debugging if enabled
  if (options?.debug) {
    const name = options.name || `Signal(${signalId})`;
    console.log(`[SIGNAL] ${name} created with initial value:`, initialValue);
    
    const originalSetMethod = extendedSignal.set;
    extendedSignal.set = (newValue: T | ((prev: T) => T)) => {
      const previous = internalSignal();
      
      // Handle both direct and functional updates for debugging
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as Function)(previous)
        : newValue;
      
      console.log(`[SIGNAL] ${name} updating:`, {
        previous,
        new: resolvedValue,
      });
      
      originalSetMethod(newValue);
    };
  }
  
  // Add subscribe method with better cleanup
  extendedSignal.subscribe = (callback: (value: T) => void) => {
    const effectRef = effect(() => {
      const value = internalSignal();
      try {
        callback(value);
      } catch (e) {
        console.error(`Error in signal subscription callback for ${options?.name || signalId}:`, e);
      }
    });
    
    return () => { 
      effectRef.destroy(); 
    };
  };
  
  return extendedSignal;
}

/**
 * Helper function to check equality (configurable)
 */
function areEqual(a: any, b: any, customEquals?: (a: any, b: any) => boolean): boolean {
  if (customEquals) {
    return customEquals(a, b);
  }
  
  // Simple shallow equality check
  if (a === b) return true;
  
  // Handle primitive equality
  if (
    a === null || b === null ||
    typeof a !== 'object' || typeof b !== 'object'
  ) {
    return a === b;
  }
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!areEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Simple object comparison
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!areEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Enhanced React hook for signal use with performance optimizations
 * @param signal The signal to subscribe to
 * @returns [value, setValue] tuple with memoized setter
 */
export function useSignal<T>(signal: Signal<T>): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(signal.get());
  const isInitialMount = useRef(true);
  
  // Use reference to track current signal to prevent stale closures
  const signalRef = useRef(signal);
  signalRef.current = signal;
  
  useEffect(() => {
    // Don't subscribe on first render, we already have the value
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Subscribe to signal updates
    const unsubscribe = signalRef.current.subscribe((newValue) => {
      setValue(newValue);
    });
    
    // Clean up subscription on unmount or signal change
    return () => {
      unsubscribe();
    };
  }, [signal]); // Re-subscribe if signal reference changes
  
  // Memoize the setter to avoid unnecessary re-renders
  const setSignalValue = useCallback((newValue: T | ((prev: T) => T)) => {
    signalRef.current.set(newValue);
  }, []);
  
  return [value, setSignalValue];
}

// Re-export existing functionality (omitted for brevity)
// createPersistentSignal, createDerivedSignal, createStateSignal, etc.

// Re-export Angular signal API
export { signal, computed, effect };

// Export additional types for better developer experience
export type SignalOptions = CreateSignalOptions;
export type SignalValue<S> = S extends Signal<infer T> ? T : never;
export type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;