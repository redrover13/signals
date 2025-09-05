// jest.preset.mjs
export default {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
      useESM: true,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  extensionsToTreatAsEsm: ['.ts'],
  coverageReporters: ['html', 'lcov', 'text'],
  preset: 'ts-jest/presets/js-with-ts-esm',
};
