/**
 * @fileoverview Tests for the FederationDemo component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for the FederationDemo component.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FederationDemo from './index';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the remote component
vi.mock('frontend-agents/AgentInterface', () => ({
  __esModule: true,
  default: ({ agentId, isFederated }) => (
    <div data-testid="remote-agent-interface">
      Remote Agent Interface Component
      <div>Agent ID: {agentId}</div>
      <div>Is Federated: {isFederated ? 'Yes' : 'No'}</div>
    </div>
  )
}), { virtual: true });

describe('FederationDemo Component', () => {
  it('renders successfully', () => {
    const { baseElement } = render(<FederationDemo />);
    expect(baseElement).toBeTruthy();
  });

  it('displays the correct heading', () => {
    render(<FederationDemo />);
    expect(screen.getByText('Module Federation Demo')).toBeInTheDocument();
  });

  it('displays a loading indicator while the remote component is loading', () => {
    // Mock the implementation to simulate loading
    jest.mock('react', () => {
      const originalReact = jest.requireActual('react');
      return {
        ...originalReact,
        lazy: () => {
          const Component = () => null;
          Component.displayName = 'LazyComponent';
          return Component;
        },
        Suspense: ({ fallback }) => fallback,
      };
    });
    
    render(<FederationDemo />);
    expect(screen.getByText('Loading remote component...')).toBeInTheDocument();
  });

  it('passes the correct props to the remote component', () => {
    render(<FederationDemo agentId="test-agent" />);
    
    const remoteComponent = screen.getByTestId('remote-agent-interface');
    expect(remoteComponent).toBeInTheDocument();
    expect(screen.getByText('Agent ID: test-agent')).toBeInTheDocument();
    expect(screen.getByText('Is Federated: Yes')).toBeInTheDocument();
  });

  it('uses default agentId if none is provided', () => {
    render(<FederationDemo />);
    expect(screen.getByText('Agent ID: gemini-orchestrator')).toBeInTheDocument();
  });
});
