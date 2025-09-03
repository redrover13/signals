/**
 * @fileoverview angular-signal-adapter module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import type { Signal } from '../index.js';

/**
 * Enhanced signal interface that includes methods for our implementation
 */
export interface EnhancedSignal<T> extends Signal<T> {
  /**
   * Update the signal value
   */
  set: (value: T | ((prev: T) => T)) => void;

  /**
   * Get the current value of the signal value
   */
  get: () => T;

  /**
   * Subscribe to changes in the signal value
   */
  subscribe: (callback: (value: T) => void) => () => void;
}

/**
 * Create a signal with the given initial value
 * @param initialValue Initial value for the signal
 * @returns Signal instance
 */
export function createSignal<T>(initialValue: T): EnhancedSignal<T> {
  let currentValue = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const signalFunction = (() => currentValue) as EnhancedSignal<T>;

  signalFunction.set = (value: T | ((prev: T) => T)) => {
    const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(currentValue) : value;
    if (nextValue !== currentValue) {
      currentValue = nextValue;
      subscribers.forEach(callback => callback(currentValue));
    }
  };

  signalFunction.get = () => currentValue;

  signalFunction.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  return signalFunction;
}

/**
 * Create a computed signal derived from other signals
 * @param derivationFn Function that computes the derived value
 * @returns Computed signal
 */
export function createComputed<T>(derivationFn: () => T): EnhancedSignal<T> {
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
    throw new Error('Cannot set value of computed signal');
  };

  computedSignal.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  return computedSignal;
}

/**
 * Create an effect that runs when dependencies change
 * @param effectFn The effect function to run
 * @returns A function to clean up the effect
 */
export function createEffect(effectFn: () => void): () => void {
  effectFn(); // Run immediately for now
  return (): void => {}; // No-op cleanup
}

export type { Signal };
export { createComputed as computed, createEffect as effect, createSignal as signal };
