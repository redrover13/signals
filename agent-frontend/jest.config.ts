/**
 * @fileoverview Jest config for agent-frontend component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export default {
  displayName: 'agent-frontend',
  preset: '../jest.preset.cjs',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
    '^.+\\.css$': 'jest-transform-css',
    '^.+\\.svg$': 'jest-transform-stub',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.css$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testEnvironment: 'jsdom',
  coverageDirectory: '../coverage/agent-frontend',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/__tests__/**/*',
    '!src/**/__mocks__/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './junit',
        outputName: 'agent-frontend.xml',
      },
    ],
  ],
};
