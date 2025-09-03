/**
 * @fileoverview app module for the app component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import styles from './app.module.css';
import { AgentInterface } from './components/agent-interface';
import { useState, useCallback, lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/error-boundary';
import { getAgentConfig } from '../utils/env-config';

// Lazy-load the federation demo component
const FederationDemo = lazy(() => import('./federation-demo/index.tsx'));

export function App() {
  const [showFederationDemo, setShowFederationDemo] = useState(false);
  const agentConfig = getAgentConfig();

  const toggleFederationDemo = useCallback(() => {
    setShowFederationDemo(prevState => !prevState);
  }, []);

  return (
    <div className={styles['app']}>
      <header className={styles['header']}>
        <h1 className={styles['title']}>Dulce de Saigon Agent Frontend</h1>
        <p className={styles['subtitle']}>Interact with AI agents for BigQuery and Firebase operations</p>
      </header>
      <nav className={styles['nav']}>
        <button 
          onClick={toggleFederationDemo}
          className={styles['button']}
          aria-pressed={showFederationDemo}
        >
          {showFederationDemo ? 'Show Local Agent Interface' : 'Show Federation Demo'}
        </button>
      </nav>
      <main className={styles['main']}>
        <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
          {showFederationDemo ? (
            <Suspense fallback={<div>Loading Federation Demo...</div>}>
              <FederationDemo agentId="gemini-orchestrator" />
            </Suspense>
          ) : (
            <AgentInterface config={agentConfig} />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;


