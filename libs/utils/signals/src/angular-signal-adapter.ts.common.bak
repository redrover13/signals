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

import { computed as angularComputed, effect as angularEffect, signal as angularSignal } from '@angular/core';
import type { Signal } from '@angular/core';

/**
 * Enhanced signal interface that includes methods for our implementation
 */
export interface EnhancedSignal<T> extends Signal<T> {
  /**
   * Update the signal value
   */
  set: (value: T) => void;
  
  /**
   * Get the current value of the signal
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
  const writable = angularSignal<T>(initialValue);
  
  // Create enhanced signal object
  const enhanced = (() => writable()) as EnhancedSignal<T>;
  
  // Add standard Angular signal methods and properties
  Object.defineProperties(enhanced, Object.getOwnPropertyDescriptors(writable));
  
  // Add our extended API
  enhanced.set = (value: T) => writable.set(value);
  enhanced.get = () => writable();
  enhanced.subscribe = (callback: (value: T) => void) => {
    const effectRef = angularEffect(() => {
      callback(writable());
    });
    return () => effectRef.destroy();
  };
  
  return enhanced;
}

/**
 * Create a computed signal derived from other signals
 * @param derivationFn Function that computes the derived value
 * @returns Computed signal
 */
export function createComputed<T>(derivationFn: () => T): EnhancedSignal<T> {
  const computed = angularComputed<T>(derivationFn);
  
  // Create enhanced signal object
  const enhanced = (() => computed()) as EnhancedSignal<T>;
  
  // Add standard Angular signal methods and properties
  Object.defineProperties(enhanced, Object.getOwnPropertyDescriptors(computed));
  
  // Add our extended API
  enhanced.get = () => computed();
  enhanced.set = (_: T) => {
    throw new Error('Cannot set value of computed signal');
  };
  enhanced.subscribe = (callback: (value: T) => void) => {
    const effectRef = angularEffect(() => {
      callback(computed());
    });
    return () => effectRef.destroy();
  };
  
  return enhanced;
}

/**
 * Create an effect that runs when dependencies change
 * @param effectFn The effect function to run
 * @returns A function to clean up the effect
 */
export function createEffect(effectFn: () => void): () => void {
  const effectRef = angularEffect(effectFn);
  return () => effectRef.destroy();
}

export type { Signal };
export { angularComputed as computed, angularEffect as effect, angularSignal as signal };
