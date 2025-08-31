export default {
  '*.{js,ts,jsx,tsx}': [
    'eslint --fix',
    'prettier --write',
    'secretlint'
  ],
  '*.{ts,tsx}': [
    () => 'pnpm ts:check'
  ],
  '*.{json,md,yml,yaml}': ['prettier --write', 'secretlint'],
  '*': ['secretlint'],
};
