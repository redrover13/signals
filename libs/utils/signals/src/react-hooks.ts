/**
 * @fileoverview react-hooks module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { useState, useEffect } from 'react';
import type { EnhancedSignal } from './angular-signal-adapter.js';

/**
 * React hook for using signals in React components
 * @param signal The signal to use
 * @returns Tuple of [value, setValue]
 */
export default function useSignal<T>(signal: EnhancedSignal<T>): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(signal.get());
  
  useEffect(() => {
    // Subscribe to signal updates
    const unsubscribe = signal.subscribe(newValue => {
      setValue(newValue);
    });
    
    // Cleanup subscription
    return unsubscribe;
  }, [signal]);
  
  // Return current value and setter
  return [value, (newValue: T) => signal.set(newValue)];
}
