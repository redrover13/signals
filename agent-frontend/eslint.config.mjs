import nx from "@nx/eslint-plugin";
import { readFileSync } from 'fs';

// Read and parse JSON configuration
const baseConfigStr = readFileSync('../.eslintrc.json', 'utf8');
const baseConfig = JSON.parse(baseConfigStr);

export default [
    ...baseConfig,
    ...nx.configs["flat/react"],
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        // Override or add rules here
        rules: {
            "react/jsx-key": "error",
            "react/prop-types": "error",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-module-boundary-types": "warn"
        }
    }
];
