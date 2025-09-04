export default {
  '*.{js,ts,jsx,tsx}': [
    'eslint --fix',
    'prettier --write',
    'secretlint',
    (files) =>
      files
        .map((file) =>
          file.endsWith('.ts') || file.endsWith('.tsx')
            ? `tsc --noEmit --skipLibCheck ${file}`
            : null,
        )
        .filter(Boolean),
  ],
  '*.{json,md,yml,yaml}': ['prettier --write', 'secretlint'],
  '*': ['secretlint'],
};
