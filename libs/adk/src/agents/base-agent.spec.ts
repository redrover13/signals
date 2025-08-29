/**
 * @fileoverview Test file for ADK agent implementations
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for the ADK-based agent implementations.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { DulceBaseAgent, DulceLlmAgent, AgentConfig } from '../agents/base-agent';
import { RootAgent, createRootAgent } from '../agents/root-agent';

// Mock the ADK dependencies
jest.mock('@waldzellai/adk-typescript', () => ({
  BaseAgent: class MockBaseAgent {
    async invoke(context: any) {
      return { result: 'base agent result', context };
    }
  },
  LlmAgent: class MockLlmAgent {
    constructor(public llm: any, public tools: any[]) {}
    async invoke(context: any) {
      return { result: 'llm agent result', context };
    }
    getName() { return 'Mock LLM Agent'; }
    getDescription() { return 'Mock description'; }
  },
  GeminiLlm: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({ content: 'Mocked LLM response' }),
  })),
  SequentialAgent: class MockSequentialAgent {
    constructor(public agents: any[]) {}
    async invoke(context: any) {
      return { result: 'sequential result', context };
    }
  },
}));

describe('DulceBaseAgent', () => {
  let config: AgentConfig;
  let agent: DulceBaseAgent;

  beforeEach(() => {
    config = {
      name: 'Test Agent',
      description: 'Test description',
      maxIterations: 5,
    };
    agent = new DulceBaseAgent(config);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(agent.getName()).toBe('Test Agent');
      expect(agent.getDescription()).toBe('Test description');
    });

    it('should use default values for optional config', () => {
      const minimalAgent = new DulceBaseAgent({ name: 'Minimal' });
      expect(minimalAgent.getName()).toBe('Minimal');
      expect(minimalAgent.getDescription()).toBe('');
    });
  });

  describe('invoke', () => {
    it('should execute with logging and monitoring', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const context = { task: 'test task' };

      const result = await agent.invoke(context);

      expect(consoleSpy).toHaveBeenCalledWith('Executing agent: Test Agent');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Agent Test Agent completed in \d+ms/));
      expect(result).toEqual({ result: 'base agent result', context });

      consoleSpy.mockRestore();
    });

    it('should handle errors with logging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockAgent = new DulceBaseAgent(config);
      const { BaseAgent } = jest.requireMock('@waldzellai/adk-typescript');
      const spy = jest.spyOn(BaseAgent.prototype, 'invoke').mockRejectedValue(new Error('Test error'));
      await expect(mockAgent.invoke({ task: 'test' })).rejects.toThrow('Test error');
      expect(consoleSpy).toHaveBeenCalledWith('Agent Test Agent failed:', expect.any(Error));
      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});

describe('RootAgent', () => {
  let rootAgent: RootAgent;
  let mockSubAgent: any;

  beforeEach(() => {
    rootAgent = createRootAgent();
    mockSubAgent = {
      getName: () => 'Mock Sub Agent',
      getDescription: () => 'Mock sub agent description',
      invoke: jest.fn().mockResolvedValue({ result: 'sub agent result' }),
    };
  });

  describe('registerSubAgent', () => {
    it('should register and retrieve sub-agents', () => {
      rootAgent.registerSubAgent('test-agent', mockSubAgent);
      
      const availableAgents = rootAgent.getAvailableAgents();
      expect(availableAgents).toContain('test-agent');
    });
  });

  describe('routeTask', () => {
    it('should route tasks using LLM', async () => {
      const task = 'Analyze restaurant data';
      const context = { restaurant: 'Test Restaurant' };

      // Mock the LLM response
      const mockLlm = (rootAgent as any).llm;
      mockLlm.invoke.mockResolvedValueOnce({ content: 'Task routed successfully' });

      const result = await rootAgent.routeTask(task, context);
      expect(result).toBeDefined();
      expect(mockLlm.invoke).toHaveBeenCalled();
    });
  });

  describe('executeWorkflow', () => {
    beforeEach(() => {
      rootAgent.registerSubAgent('test-agent', mockSubAgent);
    });

    it('should execute a simple workflow', async () => {
      const workflow = [
        {
          name: 'step1',
          agentName: 'test-agent',
          task: 'Process data',
          required: true,
        }
      ];

      const result = await rootAgent.executeWorkflow(workflow);

      expect(result).toEqual({
        workflowId: expect.stringMatching(/^workflow_\d+$/),
        status: 'completed',
        results: [
          {
            step: 'step1',
            agentName: 'test-agent',
            result: { result: 'sub agent result' },
            timestamp: expect.any(String),
          }
        ],
        summary: 'Executed 1 steps with 1 successful',
      });
    });

    it('should handle workflow step failures', async () => {
      mockSubAgent.invoke.mockRejectedValueOnce(new Error('Step failed'));
      
      const workflow = [
        {
          name: 'failing-step',
          agentName: 'test-agent',
          task: 'This will fail',
          required: false,
        }
      ];

      const result = await rootAgent.executeWorkflow(workflow);

      expect(result.results[0]).toEqual({
        step: 'failing-step',
        agentName: 'test-agent',
        error: 'Step failed',
        timestamp: expect.any(String),
      });
    });

    it('should throw on required step failure', async () => {
      mockSubAgent.invoke.mockRejectedValueOnce(new Error('Required step failed'));
      
      const workflow = [
        {
          name: 'required-step',
          agentName: 'test-agent',
          task: 'This will fail',
          required: true,
        }
      ];

      await expect(rootAgent.executeWorkflow(workflow)).rejects.toThrow("Required step 'required-step' failed");
    });
  });

  describe('getStatus', () => {
    it('should return comprehensive status', async () => {
      rootAgent.registerSubAgent('test-agent', mockSubAgent);
      
      const status = await rootAgent.getStatus();

      expect(status).toEqual({
        rootAgent: {
          name: 'Root Orchestrator Agent',
          description: 'Main orchestrator for all Dulce de Saigon F&B platform agents',
          status: 'active',
          toolsCount: expect.any(Number),
        },
        subAgents: [
          {
            name: 'test-agent',
            description: 'Mock sub agent description',
            status: 'active',
          }
        ],
        totalAgents: 2,
        lastCheck: expect.any(String),
      });
    });
  });
});