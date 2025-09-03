/**
 * @fileoverview Agent Interface Component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * React component for interacting with AI agents.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React, { useState, useCallback, memo } from 'react';
import { MainAgent } from '@dulce/agents-sdk';
import { AgentConfig, AgentResponse } from '../../types/firebase';
import styles from './agent-interface.module.css';

interface AgentInterfaceProps {
  config: AgentConfig;
}

export const AgentInterface: React.FC<AgentInterfaceProps> = memo(({ config }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const agent = new MainAgent(config.apiKey, config.projectId, config.firebaseConfig);
      const result = await agent.orchestrate(query);
      setResponse(result);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  }, [query, config]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className={styles['agentInterface']}>
      <h2>AI Agent Interface</h2>
      <form onSubmit={handleSubmit} aria-label="Agent query form">
        <div className={styles['inputGroup']}>
          <label htmlFor="agent-query" className={styles['visuallyHidden']}>Query</label>
          <textarea
            id="agent-query"
            value={query}
            onChange={handleQueryChange}
            placeholder="Enter your query (e.g., 'Show me sales data for last month' or 'Update customer status')"
            rows={4}
            cols={50}
            disabled={loading}
            aria-describedby="query-instructions"
          />
          <div id="query-instructions" className={styles['visuallyHidden']}>
            Enter a natural language query to interact with the AI agent
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className={styles['submitButton']}
          aria-busy={loading}
        >
          {loading ? 'Processing...' : 'Send Query'}
        </button>
      </form>

      {response && (
        <div className={styles['responseSection']} aria-live="polite">
          <h3>Response:</h3>
          <div className={`${styles['response']} ${response.success ? styles['success'] : styles['error']}`}>
            {response.success ? (
              <div>
                <p><strong>Success!</strong></p>
                {response.data && (
                  <pre className={styles['jsonDisplay']}>{JSON.stringify(response.data, null, 2)}</pre>
                )}
                {response.message && <p>{response.message}</p>}
              </div>
            ) : (
              <div>
                <p><strong>Error:</strong> {response.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});