import { jest } from '@jest/globals';

describe('SecretManager', () => {
  let secretManager;
  
  beforeEach(() => {
    // Reset mocks between tests
    jest.resetAllMocks();
    
    // Mock the Secret Manager client
    jest.mock('@google-cloud/secret-manager', () => ({
      SecretManagerServiceClient: jest.fn().mockImplementation(() => ({
        accessSecretVersion: jest.fn().mockResolvedValue([
          {
            payload: {
              data: Buffer.from('test-secret-value')
            }
          }
        ]),
        createSecret: jest.fn().mockResolvedValue([{ name: 'test-secret' }]),
        addSecretVersion: jest.fn().mockResolvedValue([{ name: 'test-secret/versions/1' }])
      }))
    }));
    
    // Import the service after mocking dependencies
    const { SecretManager } = require('./secret-manager');
    secretManager = new SecretManager({
      projectId: 'test-project'
    });
  });
  
  it('should initialize correctly', () => {
    expect(secretManager).toBeDefined();
    expect(secretManager.projectId).toBe('test-project');
  });
  
  it('should retrieve secrets', async () => {
    const secretValue = await secretManager.getSecret('test-secret');
    
    expect(secretValue).toBeDefined();
    expect(secretValue).toBe('test-secret-value');
    
    // Test caching
    const cachedValue = await secretManager.getSecret('test-secret');
    expect(cachedValue).toBe('test-secret-value');
  });
  
  it('should create secrets', async () => {
    const result = await secretManager.createSecret('new-secret', 'new-secret-value');
    
    expect(result).toBeDefined();
    expect(result).toBe('test-secret/versions/1');
  });
  
  it('should handle errors gracefully', async () => {
    // Mock an error
    const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    SecretManagerServiceClient.mockImplementation(() => ({
      accessSecretVersion: jest.fn().mockRejectedValue(new Error('Secret not found'))
    }));
    
    const { SecretManager } = require('./secret-manager');
    secretManager = new SecretManager({
      projectId: 'test-project'
    });
    
    await expect(secretManager.getSecret('non-existent-secret'))
      .rejects.toThrow('Secret not found');
  });
  
  it('should handle cache operations correctly', () => {
    expect(() => secretManager.clearCache()).not.toThrow();
  });
  
  // Note: Actual secret retrieval tests would require GCP setup
});
