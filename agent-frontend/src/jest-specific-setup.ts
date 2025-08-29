/**
 * @fileoverview Jest-specific test setup for agent-frontend
 *
 * This file contains setup code that is specific to the Jest testing framework.
 * It will be imported by the universal test-setup.ts file when running Jest tests.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Configure Jest specific mocks and settings
// This is useful for features that are only available in Jest or have different APIs between Jest and Vitest

// Add Jest-specific matchers if needed
expect.extend({
  // Example custom matcher for Jest
  toBeWithinRange(received, floor, ceiling) {
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

// Jest-specific environment variables
process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';

// Any other Jest-specific setup code goes here
