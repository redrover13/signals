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

import React, { useState } from 'react';
import { MainAgent } from 'agents-sdk';

interface AgentInterfaceProps {
  config: {
    apiKey: string;
    projectId: string;
    firebaseConfig: any;
  };
}

export const AgentInterface: React.FC<AgentInterfaceProps> = ({ config }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  return (
    <div className="agent-interface">
      <h2>AI Agent Interface</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query (e.g., 'Show me sales data for last month' or 'Update customer status')"
            rows={4}
            cols={50}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Processing...' : 'Send Query'}
        </button>
      </form>

      {response && (
        <div className="response-section">
          <h3>Response:</h3>
          <div className={`response ${response.success ? 'success' : 'error'}`}>
            {response.success ? (
              <div>
                <p><strong>Success!</strong></p>
                {response.data && (
                  <pre>{JSON.stringify(response.data, null, 2)}</pre>
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
};