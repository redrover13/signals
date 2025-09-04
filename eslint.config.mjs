// Basic ESLint configuration for ESLint v9
export default [
    {
        // Apply to all JavaScript and TypeScript files
        files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
        
        // Basic linting rules
        rules: {
            // No unused variables
            "no-unused-vars": "warn",
            
            // No explicit any in TypeScript
            "@typescript-eslint/no-explicit-any": "warn",
            
            // Prefer const when variables aren't reassigned
            "prefer-const": "warn",
            
            // No console logs in production code
            "no-console": ["warn", { allow: ["warn", "error"] }],
            
            // TypeScript specific rules
            "@typescript-eslint/explicit-module-boundary-types": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            
            // General code quality rules
            "no-debugger": "warn"
        },
        
        // Use latest ECMAScript features
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            parser: "@typescript-eslint/parser",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        }
    }
];
