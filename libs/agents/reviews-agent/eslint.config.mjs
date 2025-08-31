import baseConfig from '../../../.eslintrc.json';
import jsoncEslintParser from 'jsonc-eslint-parser';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
        },
      ],
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
];
