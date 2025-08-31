import { readFileSync } from 'fs';

// Read and parse JSON configuration
const baseConfigStr = readFileSync('../../.eslintrc.json', 'utf8');
const baseConfig = JSON.parse(baseConfigStr);

export default [
    ...baseConfig
];
