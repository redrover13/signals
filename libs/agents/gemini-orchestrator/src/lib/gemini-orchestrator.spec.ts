/**
 * @fileoverview This file contains the test suite for the Gemini Orchestrator.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */
import { GeminiOrchestrator } from './gemini-orchestrator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BigQuery } from '@google-cloud/bigquery';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Mocks
jest.mock('@google/generative-ai');
jest.mock('@google-cloud/bigquery');
jest.mock('firebase/app');
jest.mock('firebase/firestore');

describe('GeminiOrchestrator', () => {
  let orchestrator: GeminiOrchestrator;
  let mockGenerateContent: jest.Mock;
  let mockBigQuery: jest.Mock;
  let mockSetDoc: jest.Mock;

  beforeEach(() => {
    // Mock GoogleGenerativeAI
    mockGenerateContent = jest.fn();
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: mockGenerateContent,
      }),
    }));

    // Mock BigQuery
    mockBigQuery = jest.fn();
    (BigQuery as jest.Mock).mockImplementation(() => ({
      query: mockBigQuery,
    }));

    // Mock Firebase
    mockSetDoc = jest.fn();
    (initializeApp as jest.Mock).mockReturnValue({});
    (getFirestore as jest.Mock).mockReturnValue({});
    (doc as jest.Mock).mockReturnValue({});
    (setDoc as jest.Mock).mockImplementation(mockSetDoc);

    orchestrator = new GeminiOrchestrator('test-api-key', 'test-project-id', {});
  });

  it('should orchestrate a BigQuery query', async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => 'query data' } });
    mockBigQuery.mockResolvedValue([[{ id: 1, name: 'test' }]]);

    const result = await orchestrator.orchestrate({ query: 'show me the data' });

    expect(mockGenerateContent).toHaveBeenCalledWith('show me the data');
    expect(mockBigQuery).toHaveBeenCalledWith({ query: 'SELECT * FROM dataset.table LIMIT 10' });
    expect(result).toEqual([{ id: 1, name: 'test' }]);
  });

  it('should orchestrate a Firebase update', async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => 'update realtime' } });

    await orchestrator.orchestrate({ query: 'update the user' });

    expect(mockGenerateContent).toHaveBeenCalledWith('update the user');
    expect(mockSetDoc).toHaveBeenCalledWith({}, { name: 'Updated' });
  });

  it('should throw an error for an unknown query', async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => 'unknown query' } });

    await expect(orchestrator.orchestrate({ query: 'do something else' })).rejects.toThrow(
      'No matching sub-agent for query'
    );
  });

  it('should handle errors from the generative model', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API error'));

    await expect(orchestrator.orchestrate({ query: 'any query' })).rejects.toThrow('API error');
  });
});