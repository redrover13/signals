/**
 * @fileoverview Vitest-specific test setup for agent-frontend
 *
 * This file contains setup code that is specific to the Vitest testing framework.
 * It will be imported by the universal test-setup.ts file when running Vitest tests.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Import Vitest utilities
import { expect, vi } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';

// Add Testing Library matchers
expect.extend(matchers);

// Configure Vitest specific mocks and settings
// This is useful for features that are only available in Vitest or have different APIs between Jest and Vitest

// Add Vitest-specific matchers if needed
expect.extend({
  // Example custom matcher for Vitest
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Any other Vitest-specific setup code goes here
