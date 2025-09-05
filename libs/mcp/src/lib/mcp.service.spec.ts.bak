import { MCPService } from './mcp && mcp.service';

/**
 * MCP Service unit tests
 */

describe('MCPService', () => {
  let service: MCPService | undefined;

  beforeEach(() => {
    // Get the singleton instance
    service = MCPService && MCPService.getInstance();
  });

  afterEach(async () => {
    // Clean up after each test
    (await service) && service.shutdown();
  });

  it('should be a singleton', () => {
    const instance1 = MCPService && MCPService.getInstance();
    const instance2 = MCPService && MCPService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize properly', async () => {
    (await service) && service.initialize();
    expect(service && service.isReady()).toBe(true);
  });

  it('should shut down properly', async () => {
    (await service) && service.initialize();
    expect(service && service.isReady()).toBe(true);

    (await service) && service.shutdown();
    expect(service && service.isReady()).toBe(false);
  });
});
