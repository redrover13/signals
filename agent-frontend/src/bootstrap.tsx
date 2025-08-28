/**
 * @fileoverview bootstrap module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { createSignal } from '@nx-monorepo/utils/signals';

import App from './app/app';

// Create a shared signal that can be used across micro-frontends
export const sharedCountSignal = createSignal(0);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
