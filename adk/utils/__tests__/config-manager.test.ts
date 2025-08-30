import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigManager, Environment } from '../config-manager';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Default mock implementations
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      gcp: {
        projectId: 'test-project',
        location: 'us-central1'
      },
      api: {
        url: 'https://api.example.com',
        key: 'test-api-key'
      }
    }));
    
    // Create config manager with development environment
    configManager = new ConfigManager({
      environment: Environment.DEVELOPMENT,
      configDir: './config'
    });
  });

  it('should be defined', () => {
    expect(configManager).toBeDefined();
  });

  it('should initialize with config values', () => {
    expect(configManager['config'].environment).toBe(Environment.DEVELOPMENT);
    expect(configManager['config'].configDir).toBe('./config');
  });

  it('should load configuration file', () => {
    const config = configManager.load();
    
    // Check that the correct file was loaded
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('development.json'));
    expect(fs.readFileSync).toHaveBeenCalled();
    
    // Check loaded config values
    expect(config.get('gcp.projectId')).toBe('test-project');
    expect(config.get('gcp.location')).toBe('us-central1');
    expect(config.get('api.url')).toBe('https://api.example.com');
    expect(config.get('api.key')).toBe('test-api-key');
  });

  it('should handle environment variables', () => {
    // Set environment variables
    process.env.TEST_PROJECT_ID = 'env-project';
    process.env.TEST_API_KEY = 'env-api-key';
    
    // Mock config with environment variable references
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      gcp: {
        projectId: '${TEST_PROJECT_ID}',
        location: 'us-central1'
      },
      api: {
        url: 'https://api.example.com',
        key: '${TEST_API_KEY}'
      }
    }));
    
    const config = configManager.load();
    
    // Check environment variable substitution
    expect(config.get('gcp.projectId')).toBe('env-project');
    expect(config.get('api.key')).toBe('env-api-key');
    
    // Clean up environment variables
    delete process.env.TEST_PROJECT_ID;
    delete process.env.TEST_API_KEY;
  });

  it('should handle missing config file', () => {
    // Mock file not existing
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Should throw an error when file doesn't exist
    expect(() => configManager.load()).toThrow();
  });

  it('should handle invalid JSON in config file', () => {
    // Mock invalid JSON
    (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
    
    // Should throw an error for invalid JSON
    expect(() => configManager.load()).toThrow();
  });

  it('should switch environments', () => {
    configManager.setEnvironment(Environment.PRODUCTION);
    configManager.load();
    
    // Check that the production config file was loaded
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('production.json'));
  });

  it('should handle nested config properties', () => {
    // Mock deeply nested config
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      level1: {
        level2: {
          level3: {
            value: 'nested value'
          }
        }
      }
    }));
    
    const config = configManager.load();
    
    // Get nested value
    expect(config.get('level1.level2.level3.value')).toBe('nested value');
    
    // Get intermediate object
    expect(config.get('level1.level2')).toEqual({
      level3: {
        value: 'nested value'
      }
    });
  });

  it('should handle missing config properties', () => {
    const config = configManager.load();
    
    // Non-existent property should return undefined
    expect(config.get('nonexistent.property')).toBeUndefined();
    
    // With default value
    expect(config.get('nonexistent.property', 'default')).toBe('default');
  });
});
