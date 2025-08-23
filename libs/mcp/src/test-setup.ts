/**
 * Global test setup for MCP library
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.MCP_ENVIRONMENT = 'test';

// Setup global test timeout
jest.setTimeout(30000);