/**
 * @fileoverview base-agent module for the agents component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains base agent implementation using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { 
  BaseAgent as AdkBaseAgent, 
  LlmAgent, 
  SequentialAgent,
  ParallelAgent,
  BaseLlm,
  BaseTool,
  InvocationContext,
  Event
} from '@waldzellai/adk-typescript';

/**
 * Configuration for creating agents
 */
export interface AgentConfig {
  name: string;
  description?: string;
  llm?: BaseLlm;
  tools?: BaseTool[];
  maxIterations?: number;
}

/**
 * Base agent implementation for Dulce de Saigon platform
 * Extends ADK's BaseAgent with platform-specific functionality
 */
export class DulceBaseAgent extends AdkBaseAgent {
  public override readonly name: string;
  public override readonly description: string;
  protected maxIterations: number;

  constructor(config: AgentConfig) {
    super({
      name: config.name,
      description: config.description || '',
    });
    this.maxIterations = config.maxIterations || 10;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get agent description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Core logic to run this agent via text-based conversation
   */
  protected async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
    console.log(`Executing agent: ${this.name}`);
    
    // Basic implementation - yield a simple event
    yield new Event({
      id: Event.newId(),
      invocationId: ctx.invocationId || '',
      author: this.name,
      branch: ctx.branch,
      content: {
        role: this.name,
        parts: [{ text: `Hello from ${this.name}` }]
      }
    });
  }
}

/**
 * LLM-based agent for conversational tasks
 */
export class DulceLlmAgent extends LlmAgent {
  public override readonly name: string;
  public override readonly description: string;

  constructor(config: AgentConfig & { llm: BaseLlm }) {
    super({
      name: config.name,
      description: config.description || '',
      model: config.llm,
      tools: config.tools || [],
    });
    this.name = config.name;
    this.description = config.description || '';
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }
}

/**
 * Sequential agent that executes tasks in order
 */
export class DulceSequentialAgent extends SequentialAgent {
  public override readonly name: string;
  public override readonly description: string;

  constructor(config: AgentConfig & { agents: AdkBaseAgent[] }) {
    super({
      name: config.name,
      description: config.description || '',
      subAgents: config.agents,
    });
    this.name = config.name;
    this.description = config.description || '';
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }
}

/**
 * Parallel agent that executes tasks concurrently
 */
export class DulceParallelAgent extends ParallelAgent {
  public override readonly name: string;
  public override readonly description: string;

  constructor(config: AgentConfig & { agents: AdkBaseAgent[] }) {
    super({
      name: config.name,
      description: config.description || '',
      subAgents: config.agents,
    });
    this.name = config.name;
    this.description = config.description || '';
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }
}