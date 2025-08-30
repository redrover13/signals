import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { VertexAIClient } from '../index';

// Mock the Google Cloud Vertex AI client
jest.mock('@google-cloud/vertexai', () => {
  return {
    VertexAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'Mock prediction response'
                      }
                    ]
                  }
                }
              ]
            }
          })
        })
      };
    })
  };
});

describe('VertexAIClient', () => {
  let client: VertexAIClient;

  beforeEach(() => {
    client = new VertexAIClient({
      project: 'test-project',
      location: 'us-central1',
      endpointId: 'test-endpoint'
    });
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should initialize with config values', () => {
    expect(client['config'].project).toBe('test-project');
    expect(client['config'].location).toBe('us-central1');
    expect(client['config'].endpointId).toBe('test-endpoint');
  });

  it('should make a prediction', async () => {
    const result = await client.predict({
      instances: [{ content: 'Test query' }]
    });

    expect(result).toBeDefined();
    expect(result.predictions).toContain('Mock prediction response');
  });

  it('should handle errors gracefully', async () => {
    // Override the mock to throw an error
    const mockVertexAI = require('@google-cloud/vertexai').VertexAI;
    mockVertexAI.mockImplementationOnce(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
        })
      };
    });

    client = new VertexAIClient({
      project: 'test-project',
      location: 'us-central1',
      endpointId: 'test-endpoint'
    });

    await expect(client.predict({
      instances: [{ content: 'Test query' }]
    })).rejects.toThrow('API Error');
  });
});
