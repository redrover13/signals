/**
 * @fileoverview Tests for the App component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for the App component.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './app';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lazy-loaded components
vi.mock('./federation-demo', () => ({
  __esModule: true,
  default: () => <div data-testid="federation-demo">Federation Demo Component</div>
}));

// Mock the env config
vi.mock('../utils/env-config', () => ({
  getAgentConfig: () => ({
    apiKey: 'test-api-key',
    projectId: 'test-project-id',
    firebaseConfig: {
      apiKey: 'test-firebase-api-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef'
    }
  }),
  isDevelopment: () => true
}));

describe('App Component', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should have the correct title', () => {
    render(<App />);
    expect(screen.getByText('Dulce de Saigon Agent Frontend')).toBeInTheDocument();
  });

  it('should show AgentInterface component by default', () => {
    render(<App />);
    expect(screen.getByText('AI Agent Interface')).toBeInTheDocument();
  });

  it('should switch to Federation Demo when button is clicked', async () => {
    render(<App />);
    
    // Check initial state - AgentInterface should be visible
    expect(screen.getByText('AI Agent Interface')).toBeInTheDocument();
    
    // Click the toggle button
    const toggleButton = screen.getByText('Show Federation Demo');
    await userEvent.click(toggleButton);
    
    // Federation Demo should now be visible and button text should change
    expect(screen.getByTestId('federation-demo')).toBeInTheDocument();
    expect(screen.getByText('Show Local Agent Interface')).toBeInTheDocument();
  });
});
