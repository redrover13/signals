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
