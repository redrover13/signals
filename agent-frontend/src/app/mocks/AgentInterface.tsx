/**
 * @fileoverview Mock implementation of the AgentInterface component from frontend-agents
 *
 * This file provides a mock implementation to enable builds when the actual
 * federated module is not available. This allows development and testing to
 * continue without the dependency on the remote module.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React from 'react';

interface AgentInterfaceProps {
  agentId: string;
  isFederated?: boolean;
}

/**
 * Mock implementation of the AgentInterface component
 */
export default function AgentInterface({ agentId, isFederated = false }: AgentInterfaceProps) {
  return (
    <div className="mock-agent-interface" data-testid="mock-agent-interface">
      <h3>Mock Agent Interface</h3>
      <p>This is a mock implementation for build and development purposes.</p>
      <p>Agent ID: {agentId}</p>
      <p>Federated: {isFederated ? 'Yes' : 'No'}</p>
    </div>
  );
}
