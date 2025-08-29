/**
 * @fileoverview Test file for ADK vertex implementation
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for the ADK-based Vertex AI client.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { VertexAIClient, VertexAIClientConfig } from '../services/vertex';

// Mock the ADK dependencies
jest.mock('../adk-local', () => ({
  GeminiLlm: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: 'Mocked response from Gemini',
    }),
  })),
}));

describe('VertexAIClient', () => {
  let config: VertexAIClientConfig;
  let client: VertexAIClient;

  beforeEach(() => {
    config = {
      project: 'test-project',
      location: 'us-central1',
      model: 'gemini-1.5-pro',
      apiKey: 'test-api-key',
    };
    client = new VertexAIClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(client.getConfig()).toEqual(expect.objectContaining(config));
    });

    it('should use environment variables for missing config', () => {
      process.env.GCP_PROJECT_ID = 'env-project';
      process.env.GOOGLE_API_KEY = 'env-api-key';
      
      const clientWithEnv = new VertexAIClient({});
      const resultConfig = clientWithEnv.getConfig();
      
      expect(resultConfig.project).toBe('env-project');
      expect(resultConfig.apiKey).toBe('env-api-key');
      
      delete process.env.GCP_PROJECT_ID;
      delete process.env.GOOGLE_API_KEY;
    });
  });

  describe('predict', () => {
    it('should make predictions using the LLM', async () => {
      const payload = { input: 'test data' };
      const result = await client.predict(payload);

      expect(result).toEqual({
        predictions: ['Mocked response from Gemini'],
        metadata: {
          model: config.model,
          project: config.project,
          location: config.location,
        },
      });
    });

    it('should handle prediction errors', async () => {
      const mockLlm = client.getLlm();
      (mockLlm.invoke as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      await expect(client.predict({ input: 'test' })).rejects.toThrow(
        'Vertex AI prediction failed: Error: API Error'
      );
    });
  });

  describe('generateText', () => {
    it('should generate text with prompt', async () => {
      const prompt = 'Generate Vietnamese menu description';
      const result = await client.generateText(prompt);

      expect(result).toBe('Mocked response from Gemini');
      expect(client.getLlm().invoke).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: prompt }],
      });
    });

    it('should generate text with options', async () => {
      const prompt = 'Test prompt';
      const options = { maxTokens: 100, temperature: 0.7 };
      
      await client.generateText(prompt, options);

      expect(client.getLlm().invoke).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      });
    });
  });

  describe('getLlm', () => {
    it('should return the underlying LLM instance', () => {
      const llm = client.getLlm();
      expect(llm).toBeDefined();
      expect(typeof llm.invoke).toBe('function');
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the configuration', () => {
      const returnedConfig = client.getConfig();
      expect(returnedConfig).toEqual(expect.objectContaining(config));
      expect(returnedConfig).not.toBe(config); // Should be a copy
    });
  });
});