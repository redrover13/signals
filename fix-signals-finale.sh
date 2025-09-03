#!/bin/bash

echo "Final fix for TypeScript errors in the signals library..."

# Fix index.ts - full rewrite of the top part with correct usage of signalIdCounter
cat > /home/g_nelson/signals-1/libs/utils/signals/index.ts.new << 'EOF'
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
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
let signalIdCounter = 0;

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

  signalFunction.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  // Add debugging if enabled
  if (options?.debug) {
    const name = options.name || 'Signal';
    console.log(`${name} created with initial value:`, initialValue);

    const originalSet = signalFunction.set;
    signalFunction.set = (newValue: T | ((prev: T) => T)) => {
      console.log(`${name} updating:`, {
        previous: currentValue,
        new: newValue,
      });
      originalSet(newValue);
    };
  }

  return signalFunction;
}
EOF

# Get the rest of the file correctly (from line 100 onwards, excluding any duplicated closing braces)
grep -v "^}" "/home/g_nelson/signals-1/libs/utils/signals/index.ts" | tail -n +100 >> /home/g_nelson/signals-1/libs/utils/signals/index.ts.new

# Replace the original file with the fixed version
mv /home/g_nelson/signals-1/libs/utils/signals/index.ts.new /home/g_nelson/signals-1/libs/utils/signals/index.ts

# Run build to check if errors are fixed
echo "Running build to check if errors are fixed..."
nx build signals

echo "Done fixing TypeScript errors in the signals library."
