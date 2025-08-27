// Jest test setup file for MCP library
// This file is executed before running tests

// Set up environment variables needed for tests
process.env.MCP_TEST_MODE = 'true';
process.env.MCP_PORT = '9000';
process.env.MCP_HOST = 'localhost';

// Extend Jest with custom matchers if needed
expect.extend({
  toBeValidUrl(received) {
    try {
      // eslint-disable-next-line no-new
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },
});

// Global test cleanup
afterAll(() => {
  // Reset environment variables
  delete process.env.MCP_TEST_MODE;
  delete process.env.MCP_PORT;
  delete process.env.MCP_HOST;
});
