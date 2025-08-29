/**
 * @fileoverview with-signals module for the app component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React from 'react';
import { SignalsDemo } from '@nx-monorepo/utils/signals/src/demo-components';

export function App() {
  return (
    <div>
      <header>
        <h1>Dulce de Saigon - Signals Demo</h1>
      </header>
      <main>
        <SignalsDemo />
      </main>
    </div>
  );
}

export default App;
