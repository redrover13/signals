const nx = require("@nx/eslint-plugin");
const baseConfig = require("../.eslintrc.json");

module.exports = [
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
