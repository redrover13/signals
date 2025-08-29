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

import React from 'react';
import { createSignal, useSignal } from '@nx-monorepo/utils/signals';
import { sharedCountSignal } from '../bootstrap';

export function SignalsDemo() {
  const [count, setCount] = useSignal(sharedCountSignal);
  const localSignal = createSignal('Local Value');
  const [localValue, setLocalValue] = useSignal(localSignal);

  return (
    <div className="signals-demo p-4 border rounded-lg bg-white shadow-md">
      <h2 className="text-xl font-bold mb-4">Signals Demo (Federated Module)</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Shared Count: {count}</h3>
        <div className="flex gap-2 mt-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded"
            onClick={() => setCount(count + 1)}
          >
            Increment
          </button>
          <button 
            className="px-3 py-1 bg-red-500 text-white rounded"
            onClick={() => setCount(count - 1)}
          >
            Decrement
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Local Value: {localValue}</h3>
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="mt-2 px-3 py-1 border rounded w-full"
        />
      </div>

      <p className="text-sm text-gray-600">
        This component is exposed via Module Federation and can be consumed by other micro-frontends.
      </p>
    </div>
  );
}

export default SignalsDemo;
