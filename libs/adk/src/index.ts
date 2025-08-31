/**
 * @fileoverview index module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Vertex AI Service
export * from './services/vertex';

// Agent Classes
export * from './agents/base-agent';
export * from './agents/root-agent';

// GCP Tools
export * from './tools/gcp-tools';
export { 
  BigQueryQueryTool, 
  BigQueryInsertTool, 
  GCSUploadTool, 
  HttpRequestTool,
  GCP_TOOLS,
  getToolByName,
  getToolNames
} from './tools/gcp-tools';

// Configuration utilities
export * from './utilities/configuration';

// Analytics - minimal implementation for compatibility
export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export class WebAnalyticsTracker {
  constructor(config?: any) {
    console.log('WebAnalyticsTracker initialized with config:', config);
  }

  track(event: AnalyticsEvent) {
    console.log('Analytics event tracked:', event);
  }

  // Back-compat with existing callers
  trackEvent(event: AnalyticsEvent) {
    this.track(event);
  }
}

export enum EventCategory {
  AGENT = 'agent',
  SYSTEM = 'system',
  USER = 'user',
}

// Re-export key ADK types for convenience
export {
  BaseAgent,
  LlmAgent,
  SequentialAgent,
  ParallelAgent,
  AgentTool,
  FunctionTool,
  BaseLlm,
  GeminiLlm,
  InvocationContext,
  ToolContext,
} from '@waldzellai/adk-typescript';
