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

import { 
  DulceSequentialAgent, 
  DulceLlmAgent,
  GeminiLlm,
  GCP_TOOLS,
  AgentConfig,
  InvocationContext 
} from '@nx-monorepo/adk';

/**
 * Root orchestrator agent that coordinates all sub-agents
 */
export class RootAgent extends DulceLlmAgent {
  private subAgents: Map<string, DulceLlmAgent>;

  constructor() {
    const llm = new GeminiLlm({
      model: 'gemini-1.5-pro',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    super({
      name: 'Root Orchestrator Agent',
      description: 'Main orchestrator for all Dulce de Saigon F&B platform agents',
      llm,
      tools: GCP_TOOLS,
    });

    this.subAgents = new Map();
  }

  /**
   * Register a sub-agent
   */
  registerSubAgent(name: string, agent: DulceLlmAgent): void {
    this.subAgents.set(name, agent);
  }

  /**
   * Get list of available sub-agents
   */
  getAvailableAgents(): string[] {
    return Array.from(this.subAgents.keys());
  }

  /**
   * Route task to appropriate sub-agent or handle directly
   */
  async routeTask(task: string, context?: any): Promise<any> {
    const prompt = `
You are the Root Orchestrator Agent for the Dulce de Saigon F&B platform.

Task: ${task}
Context: ${context ? JSON.stringify(context, null, 2) : 'None'}

Available sub-agents: ${this.getAvailableAgents().join(', ')}

Please analyze this task and either:
1. Handle it directly using your available tools if it's a simple operation
2. Route it to the most appropriate sub-agent if it requires specialized knowledge
3. Break it down into subtasks for multiple agents if needed

Consider Vietnamese F&B market specifics and data privacy regulations.

Available tools: ${GCP_TOOLS.map(tool => tool.name).join(', ')}
    `;

    return this.invoke({
      messages: [{ role: 'user', content: prompt }],
      context: { task, originalContext: context },
    });
  }

  /**
   * Execute a complex workflow across multiple agents
   */
  async executeWorkflow(workflow: WorkflowStep[]): Promise<any> {
    const results: any[] = [];

    for (const step of workflow) {
      try {
        let result;
        
        if (step.agentName === 'root') {
          result = await this.routeTask(step.task, step.context);
        } else {
          const agent = this.subAgents.get(step.agentName);
          if (!agent) {
            throw new Error(`Agent '${step.agentName}' not found`);
          }
          result = await agent.invoke({
            messages: [{ role: 'user', content: step.task }],
            context: step.context,
          });
        }

        results.push({
          step: step.name,
          agentName: step.agentName,
          result,
          timestamp: new Date().toISOString(),
        });

        // If step has dependencies on previous results, merge them into context
        if (step.dependsOn && step.dependsOn.length > 0) {
          const dependencies = results.filter(r => 
            step.dependsOn?.includes(r.step)
          );
          step.context = { ...step.context, dependencies };
        }

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

    return {
      workflowId: `workflow_${Date.now()}`,
      status: 'completed',
      results,
      summary: `Executed ${workflow.length} steps with ${results.filter(r => !r.error).length} successful`,
    };
  }

  /**
   * Get agent status and health
   */
  async getStatus(): Promise<any> {
    const subAgentStatuses = Array.from(this.subAgents.entries()).map(([name, agent]) => ({
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