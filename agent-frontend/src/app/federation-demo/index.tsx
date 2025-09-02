/**
 * @fileoverview Federation demo component that uses remote components
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Demonstrates module federation by importing components from other apps.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import styles from './federation-demo.module.css';
import MockAgentInterface from '../mocks/AgentInterface';

// Lazy load the remote component with fallback to mock
const RemoteAgentInterface = lazy(() => {
  return new Promise<typeof import('../mocks/AgentInterface')>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn('Timeout loading remote component, using mock implementation');
      import('../mocks/AgentInterface')
        .then(resolve)
        .catch(reject);
    }, 5000);

    // Try to load the remote module first
    import('frontend-agents/AgentInterface')
      .then((module) => {
        clearTimeout(timeout);
        resolve(module);
      })
      .catch((error) => {
        console.warn('Failed to load remote component, using mock implementation', error);
        clearTimeout(timeout);
        // Fallback to mock implementation
        import('../mocks/AgentInterface')
          .then(resolve)
          .catch(reject);
      });
  });
});

interface FederationDemoProps {
  agentId?: string;
}

export default function FederationDemo({ agentId = 'gemini-orchestrator' }: FederationDemoProps) {
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset error state when agentId changes
    setLoadError(null);
  }, [agentId]);

  const handleRetry = () => {
    setLoadError(null);
  };

  return (
    <div className={styles.federationDemo}>
      <h1 className={styles.title}>Module Federation Demo</h1>
      <p className={styles.description}>
        This component demonstrates module federation by loading a component from another app.
      </p>
      
      <div className={styles.remoteComponentContainer}>
        <h2 className={styles.remoteComponentTitle}>Remote Agent Interface</h2>
        
        {loadError ? (
          <div>
            <p>Failed to load remote component: {loadError.message}</p>
            <button onClick={handleRetry}>Retry</button>
          </div>
        ) : (
          <Suspense fallback={<div className={styles.loadingIndicator}>Loading remote component...</div>}>
            <ErrorCatcher onError={setLoadError}>
              <RemoteAgentInterface agentId={agentId} isFederated={true} />
            </ErrorCatcher>
          </Suspense>
        )}
      </div>
    </div>
  );
}

// Component to catch errors in Suspense boundary
interface ErrorCatcherProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

class ErrorCatcher extends React.Component<ErrorCatcherProps, { hasError: boolean }> {
  constructor(props: ErrorCatcherProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent component will show error UI
    }
    return this.props.children;
  }
}
