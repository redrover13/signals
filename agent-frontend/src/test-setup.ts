/**
 * @fileoverview Universal test setup file for agent-frontend
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Sets up the testing environment for the agent-frontend application.
 * Detects whether tests are running in Jest or Vitest and imports the appropriate setup file.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import crypto from 'crypto';

// Detect testing environment
const isVitest = typeof vi !== 'undefined';

// Import the appropriate setup file based on the detected environment
if (isVitest) {
  console.log('Detected Vitest environment - loading Vitest setup');
  import('./vitest-setup.ts');
} else {
  console.log('Detected Jest environment - loading Jest setup');
  import('./jest-setup.ts');
}

// Export common testing utilities and mocks that work in both environments
export const getTestingFramework = () => {
  return isVitest ? 'Vitest' : 'Jest';
};

// Make a global mock function available that works in both environments
export const createMock = (implementation?: (...args: any[]) => any) => {
  if (isVitest) {
    return implementation ? vi.fn(implementation) : vi.fn();
  } else {
    return implementation ? jest.fn(implementation) : jest.fn();
  }
};

// Mock for requestAnimationFrame
global.requestAnimationFrame = createMock(callback => {
  setTimeout(callback, 0);
  return 0;
});

// Mock for Web Crypto API
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: arr => {
      return crypto.randomBytes(arr.length);
    },
    subtle: {
      digest: async (algorithm, data) => {
        return Buffer.from('mocked-digest');
      },
    },
  },
});

// Silence console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('React does not recognize the') || 
     args[0].includes('Warning:'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock localStorage and sessionStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: createMock(key => store[key] || null),
    setItem: createMock((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: createMock(key => {
      delete store[key];
    }),
    clear: createMock(() => {
      store = {};
    }),
    key: createMock(index => {
      return Object.keys(store)[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Import testing environment specific setups
if (isVitest) {
  // Import Vitest specific setup if needed
  // This ensures proper TypeScript imports for Vitest
  import('./vitest-specific-setup.ts').catch(e => {
    console.log('No Vitest specific setup found. This is OK.');
  });
} else {
  try {
    // Import Jest specific setup if needed
    import('./jest-specific-setup.ts');
  } catch (e) {
    // This is OK if file doesn't exist
  }
}
