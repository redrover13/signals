/**
 * @fileoverview This file contains the test suite for the Gemini Orchestrator.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */
import { GeminiOrchestrator } from './gemini-orchestrator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as bigQueryClient from './clients/bigquery.client';
import * as firebaseClient from './clients/firebase.client';
import * as configService from './config/config.service';
import * as tools from './tools';
import { SubAgentType } from './schemas';

// Mocks
jest.mock('@google/generative-ai');
jest.mock('./clients/bigquery.client');
jest.mock('./clients/firebase.client');
jest.mock('./config/config.service');
jest.mock('./tools');

describe('GeminiOrchestrator', () => {
  let orchestrator: GeminiOrchestrator;
  let mockGenerateContent: jest.Mock;
  let mockStartChat: jest.Mock;
  let mockSendMessage: jest.Mock;
  let mockGenerativeModel: any;
  let mockChatModel: any;
  let mockLoadGeminiConfig: jest.Mock;
  let mockExecuteQuery: jest.Mock;
  let mockQueryDocuments: jest.Mock;
  let mockGetDocument: jest.Mock;
  let mockWriteDocument: jest.Mock;
  let mockGetToolFunctionDeclarations: jest.Mock;
  let mockExecuteTool: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Mock GoogleGenerativeAI
    mockGenerateContent = jest.fn();
    mockSendMessage = jest.fn();
    mockStartChat = jest.fn().mockReturnValue({
      sendMessage: mockSendMessage
    });
    mockGenerativeModel = {
      generateContent: mockGenerateContent,
      startChat: mockStartChat
    };
    
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => mockGenerativeModel
    }));

    // Mock config service
    mockLoadGeminiConfig = jest.fn().mockResolvedValue({
      apiKey: 'test-api-key',
      model: 'gemini-test-model',
      maxTokens: 8192,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      bigQueryProjectId: 'test-bigquery-project',
      firebaseProjectId: 'test-firebase-project',
      firebaseCollection: 'test-collection',
      gcpProjectId: 'test-project'
    });
    (configService.loadGeminiConfig as jest.Mock).mockImplementation(mockLoadGeminiConfig);

    // Mock BigQuery client
    mockExecuteQuery = jest.fn();
    (bigQueryClient.executeQuery as jest.Mock).mockImplementation(mockExecuteQuery);

    // Mock Firebase client
    mockQueryDocuments = jest.fn();
    mockGetDocument = jest.fn();
    mockWriteDocument = jest.fn();
    (firebaseClient.queryDocuments as jest.Mock).mockImplementation(mockQueryDocuments);
    (firebaseClient.getDocument as jest.Mock).mockImplementation(mockGetDocument);
    (firebaseClient.writeDocument as jest.Mock).mockImplementation(mockWriteDocument);

    // Mock tools
    mockGetToolFunctionDeclarations = jest.fn().mockReturnValue([
      {
        name: 'test.tool',
        description: 'A test tool',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          }
        }
      }
    ]);
    mockExecuteTool = jest.fn();
    (tools.getToolFunctionDeclarations as jest.Mock).mockImplementation(mockGetToolFunctionDeclarations);
    (tools.executeTool as jest.Mock).mockImplementation(mockExecuteTool);

    // Create orchestrator
    orchestrator = new GeminiOrchestrator();
  });

  describe('initialize', () => {
    it('should initialize the orchestrator correctly', async () => {
      await orchestrator.initialize();
      
      expect(mockLoadGeminiConfig).toHaveBeenCalled();
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
      expect(mockGetToolFunctionDeclarations).toHaveBeenCalled();
    });
    
    it('should only initialize once even if called multiple times', async () => {
      await orchestrator.initialize();
      await orchestrator.initialize();
      
      expect(mockLoadGeminiConfig).toHaveBeenCalledTimes(1);
      expect(GoogleGenerativeAI).toHaveBeenCalledTimes(1);
    });
    
    it('should handle initialization errors', async () => {
      mockLoadGeminiConfig.mockRejectedValue(new Error('Config error'));
      
      await expect(orchestrator.initialize()).rejects.toThrow();
    });
  });

  describe('orchestrate', () => {
    beforeEach(async () => {
      // Initialize the orchestrator before each test
      await orchestrator.initialize();
    });
    
    it('should route to BigQuery for data query requests', async () => {
      // Mock analysis response to route to BigQuery
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'BIGQUERY' }
      });
      
      // Mock SQL generation
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'SELECT * FROM sales.items LIMIT 10' }
      });
      
      // Mock BigQuery response
      mockExecuteQuery.mockResolvedValue([
        { id: 1, name: 'Item 1', sales: 100 },
        { id: 2, name: 'Item 2', sales: 200 }
      ]);
      
      const result = await orchestrator.orchestrate({
        query: 'What are our top-selling items?'
      });
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'test-bigquery-project',
        'SELECT * FROM sales.items LIMIT 10'
      );
      
      expect(result).toEqual({
        success: true,
        data: {
          type: 'bigquery_result',
          sql: 'SELECT * FROM sales.items LIMIT 10',
          rows: [
            { id: 1, name: 'Item 1', sales: 100 },
            { id: 2, name: 'Item 2', sales: 200 }
          ],
          rowCount: 2
        },
        fromCache: false
      });
    });
    
    it('should route to Firebase for document requests', async () => {
      // Mock analysis response to route to Firebase
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'FIREBASE' }
      });
      
      // Mock Firebase operation parsing
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify({
          operation: 'GET',
          collection: 'users',
          id: 'user123'
        })}
      });
      
      // Mock Firebase response
      mockGetDocument.mockResolvedValue({
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      });
      
      const result = await orchestrator.orchestrate({
        query: 'Get user profile for user123'
      });
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(mockGetDocument).toHaveBeenCalledWith(
        'test-firebase-project',
        'users',
        'user123'
      );
      
      expect(result).toEqual({
        success: true,
        data: {
          type: 'firebase_document',
          collection: 'users',
          id: 'user123',
          document: {
            id: 'user123',
            name: 'Test User',
            email: 'test@example.com'
          }
        },
        fromCache: false
      });
    });
    
    it('should route to tools for other requests', async () => {
      // Mock analysis response to route to tools
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'TOOL' }
      });
      
      // Mock function calls
      const mockFunctionCalls = [
        {
          name: 'test.tool',
          args: JSON.stringify({ input: 'test input' }),
        }
      ];
      
      // Mock send message response
      mockSendMessage.mockResolvedValue({
        response: {
          text: () => 'Tool response',
          functionCalls: () => mockFunctionCalls
        }
      });
      
      // Mock tool execution
      mockExecuteTool.mockResolvedValue({ result: 'Tool executed successfully' });
      
      const result = await orchestrator.orchestrate({
        query: 'Execute the test tool with input "test input"'
      });
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockStartChat).toHaveBeenCalledWith({
        generationConfig: expect.any(Object),
        tools: [{ functionDeclarations: expect.any(Array) }]
      });
      expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining('Execute the test tool'));
      expect(mockExecuteTool).toHaveBeenCalledWith('test.tool', { input: 'test input' });
      
      expect(result).toEqual({
        success: true,
        data: {
          type: 'tool_results',
          results: [
            {
              tool: 'test.tool',
              input: { input: 'test input' },
              result: { result: 'Tool executed successfully' }
            }
          ],
          text: 'Tool response'
        },
        fromCache: false
      });
    });
    
    it('should handle text responses when no function calls are made', async () => {
      // Mock analysis response to route to tools
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'TOOL' }
      });
      
      // Mock send message response with no function calls
      mockSendMessage.mockResolvedValue({
        response: {
          text: () => 'I cannot execute any tools for this request',
          functionCalls: () => []
        }
      });
      
      const result = await orchestrator.orchestrate({
        query: 'Just tell me something without using tools'
      });
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockStartChat).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalled();
      expect(mockExecuteTool).not.toHaveBeenCalled();
      
      expect(result).toEqual({
        success: true,
        data: {
          type: 'text_response',
          text: 'I cannot execute any tools for this request'
        },
        fromCache: false
      });
    });
    
    it('should use cached results when available and caching is enabled', async () => {
      // Mock analysis response to route to BigQuery for first call
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'BIGQUERY' }
      });
      
      // Mock SQL generation
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'SELECT * FROM sales.items LIMIT 10' }
      });
      
      // Mock BigQuery response
      mockExecuteQuery.mockResolvedValue([
        { id: 1, name: 'Item 1', sales: 100 }
      ]);
      
      // First call - will be cached
      await orchestrator.orchestrate({
        query: 'What are our top-selling items?',
        options: {
          cacheResults: true,
          cache: {
            ttlSeconds: 60
          }
        }
      });
      
      // Second call - should use cache
      const result = await orchestrator.orchestrate({
        query: 'What are our top-selling items?',
        options: {
          cacheResults: true,
          cache: {
            ttlSeconds: 60
          }
        }
      });
      
      // Should only call these once (for the first request)
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
      
      // Should indicate it came from cache
      expect(result.fromCache).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock analysis to throw an error
      mockGenerateContent.mockRejectedValue(new Error('API error'));
      
      await expect(orchestrator.orchestrate({
        query: 'What are our top-selling items?'
      })).rejects.toThrow();
    });
  });
});