# Testing Strategy for Agent Frontend

This document outlines the testing strategy for the Agent Frontend application, explaining how we use both Jest and Vitest testing frameworks.

## Dual Testing Framework Approach

The Agent Frontend project uses a dual testing framework approach:

1. **Jest** - For Nx integration and CI/CD pipelines
2. **Vitest** - For fast local development testing

Both frameworks are configured to work with the same test files using a universal test setup.

## Test File Organization

- Test files use the naming convention `*.spec.ts(x)` or `*.test.ts(x)`
- Place test files adjacent to the implementation files they test
- Use the `__tests__` directory for complex testing scenarios with multiple test files

## Jest Configuration

Jest is configured for use with the Nx monorepo and CI/CD pipelines.

### Running Jest Tests

```bash
# Run tests with Jest through Nx
npx nx test agent-frontend

# Run tests with Jest directly
npx jest
```

### Jest-Specific Configuration

- Configuration file: `jest.config.ts`
- Test setup file: `src/test-setup.ts` (universal) with Jest-specific code in `src/jest-specific-setup.ts`
- Jest preset from Nx: `../jest.preset.cjs`

## Vitest Configuration

Vitest is configured for fast local development testing through Vite.

### Running Vitest Tests

```bash
# Run tests with Vitest
npx vitest run

# Run tests in watch mode
npx vitest

# Run tests with coverage
npx vitest run --coverage
```

### Vitest-Specific Configuration

- Configuration is in `vite.config.ts` under the `test` section
- Test setup file: `src/test-setup.ts` (universal) with Vitest-specific code in `src/vitest-specific-setup.ts`

## Universal Test Setup

We use a universal test setup approach that detects the current testing environment and configures accordingly:

- Main setup file: `src/test-setup.ts`
- Jest-specific setup: `src/jest-specific-setup.ts`
- Vitest-specific setup: `src/vitest-specific-setup.ts`

## Writing Compatible Tests

To ensure tests work in both Jest and Vitest:

1. **Mocking**:

   ```typescript
   // Universal mocking approach
   const mock = typeof vi !== 'undefined' ? vi : jest;
   const mockFn = mock.fn();
   ```

2. **Assertions**:
   - Use Testing Library's assertion library for compatibility
   - Avoid framework-specific matchers

3. **Setup and Teardown**:

   ```typescript
   // These work in both Jest and Vitest
   beforeEach(() => {
     // Setup code
   });

   afterEach(() => {
     // Teardown code
   });
   ```

## Testing Guidelines

1. **Component Tests**:
   - Test UI components with React Testing Library
   - Mock external dependencies
   - Test both happy path and error scenarios

2. **Hook Tests**:
   - Use `@testing-library/react-hooks` for testing custom hooks
   - Verify state changes and side effects

3. **Utility Tests**:
   - Use simple unit tests for utility functions
   - Focus on input/output validation

## Example Test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles button click', async () => {
    render(<MyComponent />);
    await userEvent.click(screen.getByRole('button', { name: 'Click Me' }));
    expect(screen.getByText('Button Clicked')).toBeInTheDocument();
  });
});
```

## Coverage Requirements

We aim for the following coverage thresholds:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## When to Use Each Framework

- **Use Jest** for:
  - CI/CD pipelines
  - Integration with Nx commands
  - Tests that require Jest-specific features

- **Use Vitest** for:
  - Local development with fast feedback
  - Tests that benefit from Vite's bundling approach
  - Component tests that align with your Vite build process
