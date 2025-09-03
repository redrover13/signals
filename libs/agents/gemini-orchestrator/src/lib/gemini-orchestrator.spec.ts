/**
 * @fileoverview This file contains the test suite for the Gemini Orchestrator.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */
import { GeminiOrchestrator } from './gemini-orchestrator';
import { SubAgentType } from './schemas';

// Mock the Google Generative AI to avoid API calls in tests
jest.mock('@google/generative-ai');
jest.mock('./tools');

describe('GeminiOrchestrator', () => {
  let orchestrator: GeminiOrchestrator;

  beforeEach(() => {
    // Reset environment variables
    delete process.env['GEMINI_API_KEY'];
    delete process.env['GOOGLE_API_KEY'];
    
    orchestrator = new GeminiOrchestrator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully without API key (simulation mode)', async () => {
      await orchestrator.initialize();
      
      const status = orchestrator.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.hasModel).toBe(false);
    });

    it('should initialize with API key (when provided)', async () => {
      process.env['GEMINI_API_KEY'] = 'test-api-key';
      
      await orchestrator.initialize();
      
      const status = orchestrator.getStatus();
      expect(status.initialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await orchestrator.initialize();
      const firstStatus = orchestrator.getStatus();
      
      await orchestrator.initialize();
      const secondStatus = orchestrator.getStatus();
      
      expect(firstStatus).toEqual(secondStatus);
    });
  });

  describe('orchestration', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should handle basic text queries in simulation mode', async () => {
      const result = await orchestrator.orchestrate({
        query: 'What is the weather today?',
        context: { location: 'Ho Chi Minh City' },
        options: { timeout: 5000 }
      });

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.data).toBeDefined();
      expect(result?.metadata).toBeDefined();
      expect(result?.metadata?.subAgent).toBe(SubAgentType.TOOL);
    });

    it('should route BigQuery queries correctly', async () => {
      const result = await orchestrator.orchestrate({
        query: 'SELECT * FROM sales_data WHERE date > "2024-01-01"',
        context: {},
        options: {}
      });

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.metadata?.subAgent).toBe(SubAgentType.BIGQUERY);
    });

    it('should route Firebase queries correctly', async () => {
      const result = await orchestrator.orchestrate({
        query: 'Get documents from users collection',
        context: {},
        options: {}
      });

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.metadata?.subAgent).toBe(SubAgentType.FIREBASE);
    });

    it('should route RAG queries correctly', async () => {
      const result = await orchestrator.orchestrate({
        query: 'Search for information about Vietnamese cuisine',
        context: {},
        options: {}
      });

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.metadata?.subAgent).toBe(SubAgentType.RAG);
    });

    it('should handle invalid input gracefully', async () => {
      const result = await orchestrator.orchestrate({
        query: '',
        context: {},
        options: {}
      });

      expect(result).toBeDefined();
      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
    });

    it('should include processing time in metadata', async () => {
      const result = await orchestrator.orchestrate({
        query: 'Test query',
        context: {},
        options: {}
      });

      expect(result?.metadata?.processTime).toBeGreaterThanOrEqual(0);
      expect(result?.metadata?.timestamp).toBeDefined();
      expect(result?.metadata?.model).toBe('gemini-1.5-pro');
    });
  });

  describe('health check', () => {
    it('should return unhealthy when not initialized', async () => {
      const health = await orchestrator.healthCheck();
      expect(health.status).toBe('unhealthy');
      expect(health.details.error).toBe('Not initialized');
    });

    it('should return degraded when in simulation mode', async () => {
      await orchestrator.initialize();
      
      const health = await orchestrator.healthCheck();
      expect(health.status).toBe('degraded');
      expect(health.details.warning).toContain('simulation mode');
    });
  });

  describe('reset functionality', () => {
    it('should reset and reinitialize correctly', async () => {
      await orchestrator.initialize();
      const initialStatus = orchestrator.getStatus();
      
      await orchestrator.reset();
      const resetStatus = orchestrator.getStatus();
      
      expect(resetStatus.initialized).toBe(true);
    });
  });

  describe('query routing analysis', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should identify BigQuery patterns', async () => {
      const queries = [
        'SELECT count(*) FROM orders',
        'Run analytics on sales data',
        'Query the database for revenue',
        'Show me table information'
      ];

      for (const query of queries) {
        const result = await orchestrator.orchestrate({ query });
        expect(result?.metadata?.subAgent).toBe(SubAgentType.BIGQUERY);
      }
    });

    it('should identify Firebase patterns', async () => {
      const queries = [
        'Get document from users collection',
        'Update user profile in Firestore',
        'Delete document from inventory',
        'Save new order document'
      ];

      for (const query of queries) {
        const result = await orchestrator.orchestrate({ query });
        expect(result?.metadata?.subAgent).toBe(SubAgentType.FIREBASE);
      }
    });

    it('should identify RAG patterns', async () => {
      const queries = [
        'Search for Vietnamese recipes',
        'Find information about pho preparation',
        'What do you know about banh mi?',
        'Learn about coffee culture in Vietnam'
      ];

      for (const query of queries) {
        const result = await orchestrator.orchestrate({ query });
        expect(result?.metadata?.subAgent).toBe(SubAgentType.RAG);
      }
    });
  });
});