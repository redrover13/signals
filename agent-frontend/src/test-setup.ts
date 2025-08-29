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

// Detect testing environment
const isVitest = typeof vi !== 'undefined';

// Import the appropriate setup file based on the detected environment
if (isVitest) {
  console.log('Detected Vitest environment - loading Vitest setup');
  import('./vitest-setup');
} else {
  console.log('Detected Jest environment - loading Jest setup');
  import('./jest-setup');
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
global.requestAnimationFrame = mock.fn(callback => {
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
    getItem: mock.fn(key => store[key] || null),
    setItem: mock.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: mock.fn(key => {
      delete store[key];
    }),
    clear: mock.fn(() => {
      store = {};
    }),
    key: mock.fn(index => {
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
  import('./vitest-specific-setup').catch(e => {
    console.log('No Vitest specific setup found. This is OK.');
  });
} else {
  try {
    // Import Jest specific setup if needed
    require('./jest-specific-setup');
  } catch (e) {
    // This is OK if file doesn't exist
  }
}
