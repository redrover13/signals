import { jest } from '@jest/globals';

describe('VertexService', () => {
  let vertexService;
  
  beforeEach(() => {
    // Reset mocks between tests
    jest.resetAllMocks();
    
    // Mock the Vertex AI client
    jest.mock('@google-cloud/vertexai', () => ({
      VertexAI: jest.fn().mockImplementation(() => ({
        preview: {
          models: {
            textEmbedding: jest.fn().mockReturnValue({
              generateEmbedding: jest.fn().mockResolvedValue({
                embeddings: [{ values: [0.1, 0.2, 0.3] }]
              })
            })
          }
        }
      }))
    }));
    
    // Import the service after mocking dependencies
    const { VertexService } = require('./vertex');
    vertexService = new VertexService({
      projectId: 'test-project',
      location: 'us-central1'
    });
  });
  
  it('should initialize correctly', () => {
    expect(vertexService).toBeDefined();
    expect(vertexService.projectId).toBe('test-project');
    expect(vertexService.location).toBe('us-central1');
  });
  
  it('should chunk text properly', () => {
    const longText = 'This is a long text that should be split into multiple chunks. ' +
                    'We need to ensure that the chunks overlap correctly and maintain context. ' +
                    'The chunking algorithm should work efficiently and preserve the meaning of the text.';
    
    const chunks = vertexService.chunkText(longText, 50, 10);
    
    // Verify chunks were created
    expect(chunks.length).toBeGreaterThan(1);
    
    // Verify each chunk is no longer than the max size
    chunks.forEach(chunk => {
      expect(chunk.content.length).toBeLessThanOrEqual(50);
    });
    
    // Check that subsequent chunks have some overlap with previous ones
    if (chunks.length > 1) {
      const firstChunkEnd = chunks[0].content.split(' ').slice(-2).join(' ');
      const secondChunkStart = chunks[1].content.split(' ').slice(0, 2).join(' ');
      expect(chunks[1].content).toContain(firstChunkEnd.split(' ')[1]);
    }
  });
  
  it('should generate embeddings for text', async () => {
    const text = 'This is a test text for embeddings';
    
    const embedding = await vertexService.generateEmbedding(text);
    
    expect(embedding).toBeDefined();
    expect(embedding).toEqual([0.1, 0.2, 0.3]);
  });
  
  it('should handle indexing documents', async () => {
    // Mock Vertex Matching Engine client
    jest.mock('@google-cloud/aiplatform', () => ({
      v1: {
        IndexServiceClient: jest.fn().mockImplementation(() => ({
          indexPath: jest.fn().mockReturnValue('projects/test-project/locations/us-central1/indexes/test-index'),
          updateIndex: jest.fn().mockResolvedValue([{ done: true }])
        })),
        MatchServiceClient: jest.fn().mockImplementation(() => ({
          findNeighbors: jest.fn().mockResolvedValue([{
            nearestNeighbors: [{ neighbors: [{ datapoint: { dataPointId: 'doc1' } }] }]
          }])
        }))
      }
    }));
    
    const { VertexIndexClient } = require('./vertex');
    const client = new VertexIndexClient({
      projectId: 'test-project',
      location: 'us-central1'
    });
    
    const documents = [
      { id: 'doc1', content: 'This is the first document' },
      { id: 'doc2', content: 'This is the second document' }
    ];
    
    await expect(client.indexDocuments('test-datastore', documents))
      .resolves.not.toThrow();
  });
});
