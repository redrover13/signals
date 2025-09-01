import { readFileSync } from 'fs';

// Read and parse JSON configuration
const baseConfigStr = readFileSync('/home/g_nelson/signals-1/.eslintrc.json', 'utf8');
const baseConfig = JSON.parse(baseConfigStr);

export default [
    ...baseConfig.overrides
];
