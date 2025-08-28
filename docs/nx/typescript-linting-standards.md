# TypeScript and Linting Standards

This document outlines the TypeScript and linting standards for the Dulce de Saigon NX monorepo.

## TypeScript Configuration

The monorepo uses a strict TypeScript configuration to ensure type safety across the codebase. The main settings are defined in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Strict Mode

We use TypeScript's strict mode, which includes:

- `noImplicitAny`: Disallows implicit `any` types
- `strictNullChecks`: Ensures null and undefined are handled explicitly
- `strictFunctionTypes`: Enables stricter checking of function types
- `strictPropertyInitialization`: Ensures class properties are initialized
- `strictBindCallApply`: Ensures correct use of Function.bind, call, and apply

### Additional Checks

We also enable additional checks:

- `noImplicitOverride`: Ensures you use the `override` keyword when overriding a method
- `noPropertyAccessFromIndexSignature`: Prevents accidental access of properties with string indexers
- `noImplicitReturns`: Ensures all code paths in a function return a value
- `noFallthroughCasesInSwitch`: Prevents unintentional fall-through in switch statements

## ESLint Configuration

The monorepo uses ESLint to enforce code quality and consistency. The configuration is in `.eslintrc.json`.

### TypeScript Rules

For TypeScript files, we enforce the following rules:

```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/explicit-function-return-type": "warn",
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/explicit-member-accessibility": ["warn", { "overrides": { "constructors": "no-public" } }],
  "@typescript-eslint/member-ordering": "warn",
  "@typescript-eslint/consistent-type-assertions": "warn",
  "@typescript-eslint/prefer-optional-chain": "warn",
  "@typescript-eslint/no-inferrable-types": "warn"
}
```

#### Key Rules Explained

- `no-explicit-any`: Disallows the use of the `any` type to encourage better typing
- `explicit-function-return-type`: Requires explicit return types on functions
- `no-unused-vars`: Prevents unused variables, except those prefixed with `_`
- `no-non-null-assertion`: Discourages use of non-null assertions (`!`)
- `explicit-member-accessibility`: Requires explicit accessibility modifiers on class members
- `member-ordering`: Encourages consistent ordering of class members
- `consistent-type-assertions`: Enforces consistent type assertion style
- `prefer-optional-chain`: Encourages use of optional chaining (`?.`)
- `no-inferrable-types`: Discourages explicit type annotations when unnecessary

### JavaScript Rules

For JavaScript files, we enforce these rules:

```json
{
  "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
  "no-undef": "error",
  "no-var": "error",
  "prefer-const": "warn"
}
```

### Module Boundary Rules

We enforce module boundaries using the `@nx/enforce-module-boundaries` rule:

```json
"@nx/enforce-module-boundaries": [
  "error",
  {
    "enforceBuildableLibDependency": true,
    "allow": [],
    "depConstraints": [
      {
        "sourceTag": "*",
        "onlyDependOnLibsWithTags": ["*"]
      },
      {
        "sourceTag": "domain:mcp",
        "onlyDependOnLibsWithTags": ["domain:mcp", "domain:shared", "type:lib"]
      },
      {
        "sourceTag": "type:app",
        "onlyDependOnLibsWithTags": ["type:lib"]
      }
    ]
  }
]
```

This rule ensures that:
- All projects can depend on any library by default
- Projects tagged with `domain:mcp` can only depend on libraries with the same domain tag or `domain:shared`
- Applications can only depend on libraries, not other applications

## Best Practices

### TypeScript Best Practices

1. **Always use explicit types**: Avoid relying on type inference for public APIs
2. **Use interfaces for public APIs**: Interfaces are more extensible than types
3. **Use type aliases for complex types**: Type aliases are better for union types and mapped types
4. **Use const assertions**: Use `as const` for literal values that should be treated as constants
5. **Use discriminated unions**: For modeling complex state machines or variants

### Linting Best Practices

1. **Fix all errors before committing**: Don't commit code with linting errors
2. **Use the recommended rules**: Only deviate from recommended rules with good reason
3. **Document rule exceptions**: If you disable a rule for a specific line, explain why
4. **Run linting automatically**: Set up your editor to run ESLint on save

## Enforcement

These standards are enforced through:

1. **Pre-commit hooks**: Using lint-staged to check files before commit
2. **CI checks**: Running linting as part of the CI pipeline
3. **Code reviews**: Ensuring code follows the standards

## Troubleshooting

If you encounter linting issues:

1. **Run lint fix**: Use `nx lint --fix` to automatically fix many issues
2. **Check TypeScript version**: Make sure you're using the correct version
3. **Update ESLint plugins**: Make sure all plugins are up to date
4. **Check for conflicting rules**: Look for rules that might conflict with each other
