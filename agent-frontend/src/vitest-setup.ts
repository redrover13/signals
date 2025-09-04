/**
 * @fileoverview Vitest setup file for agent-frontend
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Sets up the testing environment for Vitest tests in the agent-frontend application.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Create a Jest compatibility layer for tests that use Jest directly
if (typeof globalThis.jest === 'undefined') {
  globalThis.jest = vi;
  window.jest = vi;
}

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock for ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock for requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 0);
  return 0;
});

// Mock for Web Crypto API
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: (arr) => {
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
    (args[0].includes('React does not recognize the') || args[0].includes('Warning:'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock localStorage and sessionStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index) => {
      return Object.keys(store)[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// For React 18+ compatibility
global.IS_REACT_ACT_ENVIRONMENT = true;

console.log('Vitest setup loaded successfully!');
