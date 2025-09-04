/**
 * Custom test runner for MCP library
 *
 * This runner extends Jest's default functionality with additional
 * configuration specific to the MCP library requirements.
 */

import { runCLI } from 'jest';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  try {
    console.log('Starting MCP test suite...');

    // Define the configuration for our test run
    const jestConfig = {
      roots: ['<rootDir>/src'],
      testMatch: ['**/*.spec.ts', '**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
      collectCoverage: true,
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov'],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      verbose: true,
    };

    // Run Jest with our custom configuration
    const { results } = await runCLI(
      {
        config: JSON.stringify(jestConfig),
        runInBand: true, // Run tests serially
        silent: false, // Show output
      },
      [path.resolve(__dirname)],
    );

    // Report results
    console.log('Test run complete');
    console.log(
      `Tests: ${results.numTotalTests}, Passed: ${results.numPassedTests}, Failed: ${results.numFailedTests}`,
    );

    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Execute the tests
runTests();
