export default {
  displayName: 'schemas',
  preset: '../../../jest.preset.cjs',
  transform: {
    '^.+\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/data-models/schemas',
};
  },
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  coverageDirectory: '../../../coverage/schemas'
};
