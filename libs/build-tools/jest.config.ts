import { readFileSync } from 'fs';

// Reading the base Jest preset using dynamic import
const { default: jestPreset } = await import('../../jest.preset.mjs');

export default {
  ...jestPreset,
  displayName: 'build-tools',
  transform: {
    '^.+\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  coverageDirectory: '../../coverage/build-tools'
};
