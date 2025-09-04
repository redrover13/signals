/**
 * @fileoverview Tests for the SignalsDemo component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for the SignalsDemo component.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignalsDemo } from './index';

// Mock the signals library
jest.mock('@dulce/signals', () => {
  let sharedValue = 0;
  let localValue = 'Local Value';
  
  return {
    createSignal: jest.fn().mockImplementation((initialValue) => {
      if (typeof initialValue === 'string') {
        localValue = initialValue;
      }
      return { __isSignal: true };
    }),
    useSignal: jest.fn().mockImplementation((signal) => {
      // If the signal is for the shared count
      if (signal.__isSharedCount) {
        return [
          sharedValue,
          (newValueOrFn) => {
            if (typeof newValueOrFn === 'function') {
              sharedValue = newValueOrFn(sharedValue);
            } else {
              sharedValue = newValueOrFn;
            }
          }
        ];
      }
      // If the signal is for the local value
      return [
        localValue,
        (newValue) => {
          localValue = newValue;
        }
      ];
    })
  };
});

// Mock the sharedCountSignal
jest.mock('../../bootstrap', () => ({
  sharedCountSignal: { __isSharedCount: true }
}));

describe('SignalsDemo Component', () => {
  it('renders successfully', () => {
    const { baseElement } = render(<SignalsDemo />);
    expect(baseElement).toBeTruthy();
  });

  it('displays the correct heading', () => {
    render(<SignalsDemo />);
    expect(screen.getByText('Signals Demo (Federated Module)')).toBeInTheDocument();
  });

  it('displays shared count value', () => {
    render(<SignalsDemo />);
    expect(screen.getByText(/Shared Count: 0/)).toBeInTheDocument();
  });

  it('increments the count when the increment button is clicked', async () => {
    render(<SignalsDemo />);
    
    const incrementButton = screen.getByText('Increment');
    await userEvent.click(incrementButton);
    
    expect(screen.getByText(/Shared Count: 1/)).toBeInTheDocument();
  });

  it('decrements the count when the decrement button is clicked', async () => {
    render(<SignalsDemo />);
    
    // First increment to ensure we have a positive value
    const incrementButton = screen.getByText('Increment');
    await userEvent.click(incrementButton);
    
    // Then decrement
    const decrementButton = screen.getByText('Decrement');
    await userEvent.click(decrementButton);
    
    expect(screen.getByText(/Shared Count: 0/)).toBeInTheDocument();
  });

  it('displays the local value', () => {
    render(<SignalsDemo />);
    expect(screen.getByText(/Local Value: Local Value/)).toBeInTheDocument();
  });

  it('updates the local value when input changes', async () => {
    render(<SignalsDemo />);
    
    const input = screen.getByLabelText('Local value input');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Local Value');
    
    expect(screen.getByText(/Local Value: New Local Value/)).toBeInTheDocument();
  });
});
