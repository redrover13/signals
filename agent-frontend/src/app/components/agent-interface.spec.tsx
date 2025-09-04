/**
 * @fileoverview Tests for the AgentInterface component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for the AgentInterface component.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentInterface } from './agent-interface';
import { AgentConfig } from '../../types/firebase';

// Mock the MainAgent class
jest.mock('agents-sdk', () => {
  return {
    MainAgent: jest.fn().mockImplementation(() => {
      return {
        orchestrate: jest.fn().mockImplementation((query) => {
          if (query.includes('error')) {
            return Promise.reject(new Error('Test error message'));
          }
          return Promise.resolve({
            success: true,
            data: { result: 'Test result' },
            message: 'Operation completed successfully',
          });
        }),
      };
    }),
  };
});

describe('AgentInterface Component', () => {
  const mockConfig: AgentConfig = {
    apiKey: 'test-api-key',
    projectId: 'test-project',
    firebaseConfig: {
      apiKey: 'test-firebase-api-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef',
    },
  };

  it('renders successfully', () => {
    const { baseElement } = render(<AgentInterface config={mockConfig} />);
    expect(baseElement).toBeTruthy();
  });

  it('displays the correct heading', () => {
    render(<AgentInterface config={mockConfig} />);
    expect(screen.getByText('AI Agent Interface')).toBeInTheDocument();
  });

  it('has a disabled submit button when textarea is empty', () => {
    render(<AgentInterface config={mockConfig} />);
    const submitButton = screen.getByText('Send Query');
    expect(submitButton).toBeDisabled();
  });

  it('enables the submit button when query is entered', async () => {
    render(<AgentInterface config={mockConfig} />);
    const textarea = screen.getByPlaceholderText(/Enter your query/i);
    await userEvent.type(textarea, 'Test query');

    const submitButton = screen.getByText('Send Query');
    expect(submitButton).not.toBeDisabled();
  });

  it('shows loading state during query submission', async () => {
    render(<AgentInterface config={mockConfig} />);

    const textarea = screen.getByPlaceholderText(/Enter your query/i);
    await userEvent.type(textarea, 'Test query');

    const submitButton = screen.getByText('Send Query');
    fireEvent.click(submitButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('displays successful response', async () => {
    render(<AgentInterface config={mockConfig} />);

    const textarea = screen.getByPlaceholderText(/Enter your query/i);
    await userEvent.type(textarea, 'Test query');

    const submitButton = screen.getByText('Send Query');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
      expect(screen.getByText(/"result": "Test result"/)).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    render(<AgentInterface config={mockConfig} />);

    const textarea = screen.getByPlaceholderText(/Enter your query/i);
    await userEvent.type(textarea, 'cause error');

    const submitButton = screen.getByText('Send Query');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });
});
