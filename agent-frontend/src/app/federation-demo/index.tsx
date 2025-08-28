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

import React, { lazy, Suspense } from 'react';

// Lazy load the remote component
const RemoteAgentInterface = lazy(() => import('frontend-agents/AgentInterface'));

interface FederationDemoProps {
  agentId?: string;
}

export default function FederationDemo({ agentId = 'gemini-orchestrator' }: FederationDemoProps) {
  return (
    <div className="federation-demo">
      <h1>Module Federation Demo</h1>
      <p>This component demonstrates module federation by loading a component from another app.</p>
      
      <div className="remote-component-container">
        <h2>Remote Agent Interface</h2>
        <Suspense fallback={<div>Loading remote component...</div>}>
          <RemoteAgentInterface agentId={agentId} isFederated={true} />
        </Suspense>
      </div>
    </div>
  );
}
