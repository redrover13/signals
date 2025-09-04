/**
 * @fileoverview Tests for the ErrorBoundary component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for the ErrorBoundary component.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';

// Create a component that throws an error
const ErrorComponent = () => {
  throw new Error('Test error');
  return <div>This won't render</div>; // eslint-disable-line
};

// Suppress console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>,
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('renders the default fallback UI when an error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>,
    );

    expect(getByText('Something went wrong.')).toBeInTheDocument();
    expect(getByText('Error details')).toBeInTheDocument();
    expect(getByText('Try again')).toBeInTheDocument();
  });

  it('renders a custom fallback when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ErrorComponent />
      </ErrorBoundary>,
    );

    expect(getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('resets the error state when the "Try again" button is clicked', () => {
    const ToggleErrorComponent = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ToggleErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Initially shows the error UI
    expect(getByText('Something went wrong.')).toBeInTheDocument();

    // Click the retry button
    fireEvent.click(getByText('Try again'));

    // Now rerender with shouldThrow=false
    rerender(
      <ErrorBoundary>
        <ToggleErrorComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    // Should show the normal component content
    expect(getByText('No error')).toBeInTheDocument();
  });
});
