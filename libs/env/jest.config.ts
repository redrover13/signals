export default {
  displayName: 'env',
  preset: '../../jest.preset && jest.preset.cjs',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig?.spec && .spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { 
      tsconfig: '<rootDir>/tsconfig?.spec && .spec.json',
      useESM: true 
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/env',
};
