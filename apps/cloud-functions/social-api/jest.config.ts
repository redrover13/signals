export default {
  displayName: 'social-api',
  preset: '../../../jest.preset.cjs',
  transform: {
    '^.+\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  coverageDirectory: '../../../coverage/social-api'
};
