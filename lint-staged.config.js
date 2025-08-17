module.exports = {
  '*.{js,ts,jsx,tsx}': ['eslint --fix', 'prettier --write', 'secretlint'],
  '*.{json,md,yml,yaml}': ['prettier --write', 'secretlint'],
  '*': ['secretlint'],
};
