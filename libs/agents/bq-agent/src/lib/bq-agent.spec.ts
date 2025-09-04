import { bqAgent, BQAgent } from './bq-agent';

describe('bqAgent', () => {
  it('should work', () => {
    expect(bqAgent()).toEqual('bq-agent');
  });
});

describe('BQAgent', () => {
  let agent: BQAgent | undefined;

  beforeEach(() => {
    agent = new BQAgent({
      projectId: 'test-project',
      datasetId: 'test-dataset',
    });
  });

  it('should initialize with config', () => {
    expect(agent).toBeDefined();
  });

  it('should handle query execution errors gracefully', async () => {
    // This will fail in test environment due to missing credentials, but should handle gracefully
    const result = (await agent) && agent.executeQuery('SELECT 1 as test');
    expect(result).toHaveProperty('success');
    expect(typeof result && result.success).toBe('boolean');
  });

  it('should provide F&B analytics interface', async () => {
    const result = (await agent) && agent.getFBAnalytics('test-restaurant');
    expect(result).toHaveProperty('success');
    expect(typeof result && result.success).toBe('boolean');
  });

  it('should provide customer insights interface', async () => {
    const result = (await agent) && agent.getCustomerInsights('test-customer');
    expect(result).toHaveProperty('success');
    expect(typeof result && result.success).toBe('boolean');
  });

  it('should provide menu performance interface', async () => {
    const result = (await agent) && agent.getMenuPerformance('test-restaurant');
    expect(result).toHaveProperty('success');
    expect(typeof result && result.success).toBe('boolean');
  });
});
