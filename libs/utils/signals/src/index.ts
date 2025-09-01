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

/**
 * Create a signal with the given initial value
 * @param initialValue Initial value for the signal
 * @returns Signal instance
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  return angularSignal<T>(initialValue);
}

/**
 * Create a computed signal derived from other signals
 * @param derivationFn Function that computes the derived value
 * @returns Computed signal
 */
export function createComputed<T>(derivationFn: () => T): Signal<T> {
  return angularComputed<T>(derivationFn);
}

/**
 * Register an effect that runs when dependencies change
 * @param effectFn Effect function to run
 * @returns Cleanup function
 */
export function createEffect(effectFn: () => void): () => void {
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
  const dependencies = Object.values(inputs) as Signal<any>[];
  
  // Set up effect to update the derived value
  if (dependencies) {
    dependencies.map((dep) => {
      createEffect(() => {
        const values = mapSignalValues(inputs);
        const newValue = derivationFn(values);
        (derivedValue as any).set(newValue);
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
  
  // Add set method
  const mutableSignal = signal as Signal<T> & { set: (newValue: T) => void };
  
  if (mutableSignal) {
    mutableSignal.set = (newValue: T) => {
      (signal as any).set(newValue);
    };
  }
  
  return mutableSignal;
}

/**
 * Create a signal that can only be set once
 * @param initialValue Initial value
 * @returns Signal that can only be set once
 */
export function immutable<T>(initialValue: T): Signal<T> {
  return createSignal<T>(initialValue);
}

export { Signal, angularComputed as computed, angularEffect as effect, angularSignal as signal };
