/**
 * MCP Service unit tests
 */

class MCPService {
  private static instance: MCPService | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
    return Promise.resolve();
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    return Promise.resolve();
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

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
