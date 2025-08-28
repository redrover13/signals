/**
 * @fileoverview Type definitions for the agents SDK
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains TypeScript type definitions for agent operations.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export interface AgentConfig {
  apiKey: string;
  projectId: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface SubAgentInterface {
  execute(input: any): Promise<AgentResponse>;
}

export interface QueryRequest {
  query: string;
  context?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export interface OrchestrationResult extends AgentResponse {
  agentUsed?: 'bigquery' | 'firebase' | 'none';
  executionTime?: number;
}