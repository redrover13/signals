/**
 * @fileoverview index module for the signals-demo component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React, { useCallback, memo } from 'react';
import { createSignal, useSignal } from '@dulce/utils/signals';
import { sharedCountSignal } from '../../bootstrap';
import styles from './signals-demo.module.css';

// Create a memo function to optimize performance
const SignalsDemo = memo(() => {
  // Use the shared count signal
  const [count, setCount] = useSignal(sharedCountSignal);
  
  // Create a local signal with an initial value
  const localSignal = createSignal('Local Value');
  const [localValue, setLocalValue] = useSignal(localSignal);

  // Use callbacks to prevent unnecessary re-renders
  const handleIncrement = useCallback(() => {
    setCount(prevCount => prevCount + 1);
  }, [setCount]);

  const handleDecrement = useCallback(() => {
    setCount(prevCount => prevCount - 1);
  }, [setCount]);

  const handleLocalValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, [setLocalValue]);

  return (
    <div className={styles['signalsDemo']}>
      <h2 className={styles['title']}>Signals Demo (Federated Module)</h2>
      
      <div className={styles['section']}>
        <h3 className={styles['sectionTitle']}>Shared Count: {count}</h3>
        <div className={styles['buttonGroup']}>
          <button 
            className={`${styles['button']} ${styles['incrementButton']}`}
            onClick={handleIncrement}
            aria-label="Increment shared count"
          >
            Increment
          </button>
          <button 
            className={`${styles['button']} ${styles['decrementButton']}`}
            onClick={handleDecrement}
            aria-label="Decrement shared count"
          >
            Decrement
          </button>
        </div>
      </div>

      <div className={styles['section']}>
        <h3 className={styles['sectionTitle']}>Local Value: {localValue}</h3>
        <input
          type="text"
          value={localValue}
          onChange={handleLocalValueChange}
          className={styles['input']}
          aria-label="Local value input"
        />
      </div>

      <p className={styles['footer']}>
        This component is exposed via Module Federation and can be consumed by other micro-frontends.
      </p>
    </div>
  );
});

// Add displayName for better debugging
SignalsDemo.displayName = 'SignalsDemo';

export { SignalsDemo };
export default SignalsDemo;
