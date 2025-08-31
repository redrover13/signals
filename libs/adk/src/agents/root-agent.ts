/**
 * @fileoverview root-agent module for the agents component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains root orchestrator agent implementation using Google's ADK.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { LlmAgent, GeminiLlm, InvocationContext } from '@waldzellai/adk-typescript';
import { GCP_TOOLS } from '../tools/gcp-tools';

/**
 * Root agent status interface
 */
export interface RootAgentStatus {
  rootAgent: { name: string; description: string; status: string; toolsCount: number };
  subAgents: SubAgentStatus[];
  totalAgents: number;
  lastCheck: string;
}

/**
 * Sub-agent status interface
 */
export interface SubAgentStatus {
  name: string;
  description: string;
  status: string;
}

/**
 * Root agent class for coordinating multiple specialized agents
 */
export class RootAgent extends LlmAgent {
  private registeredAgents: Map<string, LlmAgent>;
  public readonly name: string;
  public readonly description: string;

  constructor() {
    const llm = new GeminiLlm({
      model: 'gemini-1.5-pro',
      apiKey: process.env['GOOGLE_API_KEY'] || 'default-key',
    });

    super({
      name: 'Root Orchestrator Agent',
      description: 'Main orchestrator for all Dulce de Saigon F&B platform agents',
      model: llm,
      tools: GCP_TOOLS,
    });

    this.name = 'Root Orchestrator Agent';
    this.description = 'Main orchestrator for all Dulce de Saigon F&B platform agents';
    this.registeredAgents = new Map();
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
   * Register a sub-agent
   */
  registerSubAgent(name: string, agent: LlmAgent): void {
    this.registeredAgents.set(name, agent);
  }

  /**
   * Get list of available sub-agents
   */
  getAvailableAgents(): string[] {
    return Array.from(this.registeredAgents.keys());
  }

  /**
   * Route task to appropriate sub-agent or handle directly
   */
  public async routeTask(task: string, context?: unknown): Promise<unknown> {
    let contextStr = 'None';
    try {
      if (context !== undefined) {
        contextStr = JSON.stringify(context, null, 2);
      }
    } catch {
      contextStr = '[Unserializable context]';
    }

    const prompt = `
You are the Root Orchestrator Agent for the Dulce de Saigon F&B platform.

Task: ${task}
Context: ${contextStr}

Available sub-agents: ${this.getAvailableAgents().join(', ')}

Please analyze this task and either:
1. Handle it directly using your available tools if it's a simple operation
2. Route it to the most appropriate sub-agent if it requires specialized knowledge
3. Break it down into subtasks for multiple agents if needed

Consider Vietnamese F&B market specifics and data privacy regulations.

Available tools: ${GCP_TOOLS.map(tool => tool.name).join(', ')}
    `;

    return this.runAsync({
      userContent: { role: 'user', parts: [{ text: prompt }] },
      session: null,
      invocationId: `task_${Date.now()}`,
    } as InvocationContext);
  }

  /**
   * Execute a complex workflow across multiple agents
   */
  public async executeWorkflow(workflow: WorkflowStep[]): Promise<unknown> {
    const results: Array<{
      step: string;
      agentName: string;
      result?: unknown;
      error?: string;
      timestamp: string;
    }> = [];

    for (const step of workflow) {
      try {
        // Resolve dependencies BEFORE invoking the step
        let resolvedContext = step.context;
        if (step.dependsOn && step.dependsOn.length > 0) {
          const dependencies = results.filter(r => step.dependsOn!.includes(r.step));
          resolvedContext = { ...(resolvedContext as object), dependencies };
        }

        let result;
        if (step.agentName === 'root') {
          result = await this.routeTask(step.task, resolvedContext);
        } else {
          const agent = this.registeredAgents.get(step.agentName);
          if (!agent) {
            throw new Error(`Agent '${step.agentName}' not found`);
          }
          result = await agent.runAsync({
            userContent: { role: 'user', parts: [{ text: step.task }] },
            session: null,
            invocationId: `step_${Date.now()}`,
          } as InvocationContext);
        }

        results.push({
          step: step.name,
          agentName: step.agentName,
          result,
          timestamp: new Date().toISOString(),
        });

        // no-op: dependencies already applied before invocation

      } catch (error) {
        results.push({
          step: step.name,
          agentName: step.agentName,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        if (step.required) {
          throw new Error(`Required step '${step.name}' failed: ${error}`);
        }
      }
    }

    const failed = results.some(r => r.error);
    return {
      workflowId: `workflow_${Date.now()}`,
      status: failed ? 'completed-with-errors' : 'completed',
      results,
      summary: `Executed ${workflow.length} steps with ${results.filter(r => !r.error).length} successful`,
    };
  }

  /**
   * Get agent status and health
   */
  public async getStatus(): Promise<RootAgentStatus> {
    const subAgentStatuses: SubAgentStatus[] = Array.from(this.registeredAgents.entries()).map(([name, agent]) => ({
      name,
      description: agent.getDescription(),
      status: 'active',
    }));

    return {
      rootAgent: {
        name: this.getName(),
        description: this.getDescription(),
        status: 'active',
        toolsCount: GCP_TOOLS.length,
      },
      subAgents: subAgentStatuses,
      totalAgents: subAgentStatuses.length + 1,
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * Workflow step interface
 */
export interface WorkflowStep {
  name: string;
  agentName: string;
  task: string;
  context?: any;
  dependsOn?: string[];
  required?: boolean;
}

/**
 * Factory function to create a root agent with common sub-agents
 */
export function createRootAgent(): RootAgent {
  return new RootAgent();
}