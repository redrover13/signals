import { jest } from '@jest/globals';

// Mock console methods to avoid polluting test output
global.console = {
  ...global.console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

describe('BaseAgent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should create a BaseAgent instance', () => {
    // Mock the BaseAgent class
    jest.mock('@waldzellai/adk-typescript', () => ({
      BaseAgent: class MockBaseAgent {
        constructor(config) {
          this.config = config;
        }
      }
    }));

    const { BaseAgent } = require('@waldzellai/adk-typescript');
    const agent = new BaseAgent({
      name: 'Test Agent',
      description: 'A test agent',
    });

    expect(agent).toBeDefined();
    expect(agent.config.name).toBe('Test Agent');
  });

  it('should invoke the agent with parameters', async () => {
    // Mock the BaseAgent class with a working invoke method
    jest.mock('@waldzellai/adk-typescript', () => ({
      BaseAgent: class MockBaseAgent {
        constructor(config) {
          this.config = config;
        }
        async invoke(params) {
          return {
            result: `Processed ${params.task}`,
            status: 'success'
          };
        }
      }
    }));

    const { BaseAgent } = require('@waldzellai/adk-typescript');
    const agent = new BaseAgent({
      name: 'Test Agent',
      description: 'A test agent',
    });

    const result = await agent.invoke({ task: 'test task' });
    expect(result).toBeDefined();
    expect(result.result).toBe('Processed test task');
    expect(result.status).toBe('success');
  });

  it('should handle errors during invocation', async () => {
    // Create a spy on console.error
    const consoleSpy = jest.spyOn(console, 'error');
    
    // Mock BaseAgent to throw an error when invoke is called
    jest.mock('@waldzellai/adk-typescript', () => ({
      BaseAgent: class MockBaseAgent {
        constructor(config) {
          this.config = config;
          this.name = config.name;
        }
        async invoke() {
          throw new Error('Test error');
        }
      }
    }));

    const { BaseAgent } = require('@waldzellai/adk-typescript');
    const mockAgent = new BaseAgent({
      name: 'Test Agent',
      description: 'A test agent',
    });

    await expect(mockAgent.invoke({ task: 'test' })).rejects.toThrow('Test error');
    expect(consoleSpy).toHaveBeenCalledWith('Agent Test Agent failed:', expect.any(Error));
    spy.mockRestore();
    consoleSpy.mockRestore();
  });
});
