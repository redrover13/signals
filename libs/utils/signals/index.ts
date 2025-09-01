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

import { computed, signal, Signal } from '@angular/core';

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

/**
 * Creates a signal with the provided initial value and options
 * @param initialValue The initial value for the signal
 * @param options Optional configuration
 * @returns A signal with the provided value
 */
export function createSignal<T>(initialValue: T, options?: CreateSignalOptions): Signal<T> {
  const internalSignal = signal<T>(initialValue);
  
  if (options?.debug) {
    const name = options.name || 'Signal';
    console.log(`${name} created with initial value:`, initialValue);
    
    const originalSet = internalSignal.set;
    internalSignal.set = (newValue: T) => {
      console.log(`${name} updating:`, {
        previous: internalSignal(),
        new: newValue,
      });
      originalSet(newValue);
    };
  }
  
  return internalSignal;
}

/**
 * Creates a persistent signal that saves its value to localStorage
 * @param key The localStorage key to use
 * @param initialValue The initial value (used if nothing exists in localStorage)
 * @returns A signal that persists its value
 */
export function createPersistentSignal<T>(key: string, initialValue: T): Signal<T> {
  // Get the stored value from localStorage
  let storedValue: T;
  try {
    const item = window.localStorage.getItem(key || "");
    storedValue = item ? JSON.parse(item) : initialValue || undefined;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    storedValue = initialValue;
  }
  
  // Create a signal with the stored or initial value
  const persistentSignal = signal<T>(storedValue);
  
  // Create a wrapped signal with a custom setter that updates localStorage
  const originalSet = persistentSignal.set;
  persistentSignal.set = (newValue: T) => {
    try {
      window.localStorage.setItem(key || "", JSON.stringify(newValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    originalSet(newValue);
  };
  
  return persistentSignal;
}

/**
 * Creates a derived signal based on a computation function
 * @param computeFn Function that derives a new value
 * @returns A computed signal
 */
export function createDerivedSignal<T>(computeFn: () => T): Signal<T> {
  const derivedValue = computed(computeFn);
  return derivedValue;
}

/**
 * Creates a signal with a value and a setter function
 * @param initialValue The initial value
 * @returns A tuple containing the signal and its setter
 */
export function createStateSignal<T>(initialValue: T): [Signal<T>, (value: T) => void] {
  const signal = createSignal<T>(initialValue);
  return [signal as T, signal.set];
}

export * from './src/index';
