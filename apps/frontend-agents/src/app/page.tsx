/**
 * @fileoverview page module for the app component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

'use client';

import { useState } from 'react';
import AgentInterface from '../components/AgentInterface';

export default function HomePage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dulce de Saigon Agent Platform
              </h1>
              <p className="mt-2 text-gray-600">
                AI-Powered F&B Data Platform Agents
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Available Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AgentCard
              name="BigQuery Agent"
              description="Query and analyze BigQuery data"
              onClick={() => setSelectedAgent('bq-agent')}
              isSelected={selectedAgent === 'bq-agent'}
            />
            <AgentCard
              name="Content Agent"
              description="Manage and process content data"
              onClick={() => setSelectedAgent('content-agent')}
              isSelected={selectedAgent === 'content-agent'}
            />
            <AgentCard
              name="CRM Agent"
              description="Customer relationship management"
              onClick={() => setSelectedAgent('crm-agent')}
              isSelected={selectedAgent === 'crm-agent'}
            />
            <AgentCard
              name="Gemini Orchestrator"
              description="AI-powered orchestration and automation"
              onClick={() => setSelectedAgent('gemini-orchestrator')}
              isSelected={selectedAgent === 'gemini-orchestrator'}
            />
            <AgentCard
              name="Looker Agent"
              description="Business intelligence and reporting"
              onClick={() => setSelectedAgent('looker-agent')}
              isSelected={selectedAgent === 'looker-agent'}
            />
            <AgentCard
              name="Reviews Agent"
              description="Process and analyze customer reviews"
              onClick={() => setSelectedAgent('reviews-agent')}
              isSelected={selectedAgent === 'reviews-agent'}
            />
          </div>
        </div>

        {selectedAgent && (
          <div className="mt-8">
            <AgentInterface agentId={selectedAgent} />
          </div>
        )}
      </main>
    </div>
  );
}

interface AgentCardProps {
  name: string;
  description: string;
  onClick: () => void;
  isSelected: boolean;
}

function AgentCard({ name, description, onClick, isSelected }: AgentCardProps) {
  return (
    <div
      className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
