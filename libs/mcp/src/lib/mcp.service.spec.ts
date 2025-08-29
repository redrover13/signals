import { MCPService } from './mcp.service';

/**
 * MCP Service unit tests
 */

describe('MCPService', () => {
  let service: MCPService;

  beforeEach(() => {
    // Get the singleton instance
    service = MCPService.getInstance();
  });

  afterEach(async () => {
    // Clean up after each test
    await service.shutdown();
  });

  it('should be a singleton', () => {
    const instance1 = MCPService.getInstance();
    const instance2 = MCPService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize properly', async () => {
    await service.initialize();
    expect(service.isReady()).toBe(true);
  });

  it('should shut down properly', async () => {
    await service.initialize();
    expect(service.isReady()).toBe(true);
    
    await service.shutdown();
    expect(service.isReady()).toBe(false);
  });
});
