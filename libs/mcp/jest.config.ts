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
  // Help Jest resolve monorepo local libs and node modules
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules', '<rootDir>/../../'],
  moduleNameMapper: {
    '^@nx-monorepo/gcp$': '<rootDir>/../../gcp/src/index.ts',
    '^..\/..\/gcp\/src\/index$': '<rootDir>/../../gcp/src/index.ts',
  },
};

export default config;
