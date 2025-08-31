/**
 * @fileoverview Example test file compatible with both Jest and Vitest
 *
 * This file demonstrates how to write tests that work with both testing frameworks.
 * Use this as a reference when creating new tests.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMock, getTestingFramework } from '../test-setup';

// Component to test
const ExampleButton = ({ onClick, label }: { onClick: () => void; label: string }) => {
  return (
    <button onClick={onClick} data-testid="example-button">
      {label}
    </button>
  );
};

describe('ExampleButton', () => {
  it('renders with the correct label', () => {
    const label = 'Click Me';
    render(<ExampleButton onClick={() => {}} label={label} />);
    
    const button = screen.getByTestId('example-button');
    expect(button).toHaveTextContent(label);
    
    // Log which testing framework is being used
    console.log(`Test running in ${getTestingFramework()}`);
  });

  it('calls onClick when clicked', async () => {
    // Create a mock function using our framework-agnostic helper
    const handleClick = createMock();
    render(<ExampleButton onClick={handleClick} label="Click Me" />);
    
    // Create a user event
    const user = userEvent.setup();
    
    // Find and click the button
    const button = screen.getByTestId('example-button');
    await user.click(button);
    
    // Verify the mock was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows how to use conditional testing logic if needed', () => {
    // This is a rare case, but demonstrates how to handle framework-specific code
    const isVitest = typeof vi !== 'undefined';
    
    if (isVitest) {
      console.log('Running Vitest-specific test code');
      // Vitest-specific code here if absolutely necessary
    } else {
      console.log('Running Jest-specific test code');
      // Jest-specific code here if absolutely necessary
    }
    
    // Then continue with framework-agnostic assertions
    expect(true).toBe(true);
  });
});

// Example test with lifecycle hooks
describe('Test lifecycle', () => {
  // Example of using beforeEach and afterEach (works in both Jest and Vitest)
  beforeEach(() => {
    // Setup code
    mock.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup code
  });

  it('runs lifecycle hooks properly', () => {
    expect(true).toBe(true);
  });
});

// Example of testing async code
describe('Async functionality', () => {
  it('handles promises correctly', async () => {
    // Create a mock function using the appropriate API
    const asyncMock = mock.fn().mockResolvedValue('success');

    const result = await asyncMock();
    expect(result).toBe('success');
    expect(asyncMock).toHaveBeenCalledTimes(1);
  });
});