# Testing Strategy Documentation

## Overview

This project uses a dual testing strategy with both Jest and Vitest (Vite's testing framework). Each testing framework serves a specific purpose in our development workflow.

## Testing Frameworks

### Jest

**Purpose**: Used for integration with Nx monorepo pipelines and CI/CD processes.

**Configuration Files**:
- `/agent-frontend/jest.config.ts` - Main Jest configuration
- `/jest.preset.cjs` - Shared Jest preset for the monorepo

**When to use Jest**:
- Running tests through Nx commands (`nx test agent-frontend`)
- CI/CD pipeline testing
- Tests requiring specific Jest plugins or matchers not available in Vitest
- Integration tests across library boundaries

**Running Jest Tests**:
```bash
# Run tests for a specific project
nx test agent-frontend

# Run with coverage
nx test agent-frontend --coverage

# Run in watch mode
nx test agent-frontend --watch
```

### Vitest (Vite)

**Purpose**: Used for fast component testing and development-time testing.

**Configuration Files**:
- `/agent-frontend/vite.config.ts` - Contains Vitest configuration
- `/agent-frontend/src/test-setup.ts` - Setup file for Vitest

**When to use Vitest**:
- Local development testing
- Component tests that benefit from Vite's fast HMR
- Tests that should match the exact bundling environment of the app
- Performance testing

**Running Vitest Tests**:
```bash
# Run tests directly (from project root)
npx vitest run

# Run tests with UI
npx vitest --ui

# Run tests in watch mode
npx vitest

# Run with coverage
npx vitest run --coverage
```

## Test File Organization

- All test files use the naming convention `*.spec.ts` or `*.spec.tsx`
- Component tests are co-located with their components
- Utility function tests are in `__tests__` directories

## Writing Compatible Tests

To make tests compatible with both Jest and Vitest, follow these guidelines:

1. Import testing utilities from `@testing-library/react` rather than framework-specific packages
2. Use framework-agnostic assertions when possible
3. When using framework-specific features, conditionally import based on the environment

Example of a compatible test:

```tsx
// Compatible with both Jest and Vitest
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

// Framework agnostic test
describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Mocking Strategy

- For module mocks, use `vi.mock()` or `jest.mock()` based on the testing environment
- For function mocks, prefer `vi.fn()` or `jest.fn()` based on the testing environment
- Consider using dependency injection for better testability and less mocking

## Best Practices

1. **Keep test files clean and focused**:
   - One test file per component or feature
   - Tests should be independent and not rely on execution order

2. **Use the right tool for the job**:
   - Fast component tests with Vitest
   - Integration and CI/CD tests with Jest

3. **Consistent testing patterns**:
   - Use the same testing libraries and patterns across the codebase
   - Follow the AAA pattern (Arrange, Act, Assert)

4. **Coverage**:
   - Aim for high coverage but prioritize critical paths
   - Don't write tests just to increase coverage numbers

## Troubleshooting

### Common Jest Issues

- **Module resolution errors**: Ensure `moduleNameMapper` in Jest config matches your aliases
- **Timeout errors**: Increase timeout with `jest.setTimeout()`
- **Snapshot mismatches**: Update snapshots with `nx test --updateSnapshot`

### Common Vitest Issues

- **HMR not working**: Check that you're running in watch mode
- **Import errors**: Verify your Vite configuration handles the imports correctly
- **DOM errors**: Make sure JSDOM environment is configured in `vite.config.ts`

## CI/CD Integration

- CI pipelines use Jest through Nx commands
- Local development can use either framework based on developer preference
- Pre-commit hooks run Jest tests to ensure consistency with CI
