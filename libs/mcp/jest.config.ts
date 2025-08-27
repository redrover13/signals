import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  globals: {},
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'libs/mcp/tsconfig.lib.json',
        diagnostics: { warnOnly: true },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Help Jest resolve monorepo local libs and node modules
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules', '<rootDir>/../../'],
  moduleNameMapper: {
    '^@nx-monorepo/gcp$': '<rootDir>/../../gcp/src/index.ts',
    '^..\/..\/gcp\/src\/index$': '<rootDir>/../../gcp/src/index.ts',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/test-setup.ts',
    '!src/jest.setup.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
};

export default config;
